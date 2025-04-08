import { createContext, useContext, useMemo } from "react";
import useSWR from "swr";
import useSWRSubscription from "swr/subscription";
import { getProxies, getConnections, getRules, getclassesConfig, getProxyProviders, getRuleProviders } from "@/services/api";
import { getSystemProxy, getRunningMode, getAppUptime } from "@/services/cmds";
import { useclassesInfo } from "@/hooks/use-classes";
import { createAuthSockette } from "@/utils/websocket";
import { useVisibility } from "@/hooks/use-visibility";

// 定义AppDataContext类型 - 使用宽松类型
interface AppDataContextType {
  proxies: any;
  classesConfig: any;
  rules: any[];
  sysproxy: any;
  runningMode?: string;
  uptime: number;
  proxyProviders: any;
  ruleProviders: any;
  connections: {
    data: any[];
    count: number;
    uploadTotal: number;
    downloadTotal: number;
  };
  traffic: {up: number; down: number};
  memory: {inuse: number};
  refreshProxy: () => Promise<any>;
  refreshclassesConfig: () => Promise<any>;
  refreshRules: () => Promise<any>;
  refreshSysproxy: () => Promise<any>;
  refreshProxyProviders: () => Promise<any>;
  refreshRuleProviders: () => Promise<any>;
  refreshAll: () => Promise<any>;
}

// 创建上下文
const AppDataContext = createContext<AppDataContextType | null>(null);

// 全局数据提供者组件
export const AppDataProvider = ({ children }: { children: React.ReactNode }) => {
  const { classesInfo } = useclassesInfo();
  const pageVisible = useVisibility();
  
  // 基础数据 - 中频率更新 (5秒)
  const { data: proxiesData, mutate: refreshProxy } = useSWR(
    "getProxies", 
    getProxies, 
    { 
      refreshInterval: 5000, 
      revalidateOnFocus: false,
      suspense: false,
      errorRetryCount: 3
    }
  );
  
  const { data: classesConfig, mutate: refreshclassesConfig } = useSWR(
    "getclassesConfig", 
    getclassesConfig, 
    { 
      refreshInterval: 5000, 
      revalidateOnFocus: false,
      suspense: false,
      errorRetryCount: 3 
    }
  );
  
  // 提供者数据
  const { data: proxyProviders, mutate: refreshProxyProviders } = useSWR(
    "getProxyProviders",
    getProxyProviders,
    {
      revalidateOnFocus: false,
      suspense: false,
      errorRetryCount: 3
    }
  );
  
  const { data: ruleProviders, mutate: refreshRuleProviders } = useSWR(
    "getRuleProviders",
    getRuleProviders,
    {
      revalidateOnFocus: false,
      suspense: false,
      errorRetryCount: 3
    }
  );
  
  // 低频率更新数据
  const { data: rulesData, mutate: refreshRules } = useSWR(
    "getRules", 
    getRules,
    { 
      revalidateOnFocus: false,
      suspense: false,
      errorRetryCount: 3
    }
  );
  
  const { data: sysproxy, mutate: refreshSysproxy } = useSWR(
    "getSystemProxy", 
    getSystemProxy,
    { 
      revalidateOnFocus: false,
      suspense: false,
      errorRetryCount: 3
    }
  );
  
  const { data: runningMode } = useSWR(
    "getRunningMode", 
    getRunningMode,
    { 
      revalidateOnFocus: false,
      suspense: false,
      errorRetryCount: 3
    }
  );
  
  // 高频率更新数据 (1秒)
  const { data: uptimeData } = useSWR(
    "appUptime", 
    getAppUptime, 
    { 
      refreshInterval: 1000, 
      revalidateOnFocus: false,
      suspense: false
    }
  );
  
  // 连接数据 - 使用WebSocket实时更新
  const { data: connectionsData = { connections: [], uploadTotal: 0, downloadTotal: 0 } } = 
    useSWRSubscription(
      classesInfo && pageVisible ? "connections" : null,
      (_key, { next }) => {
        if (!classesInfo || !pageVisible) return () => {};
        
        const { server = "", secret = "" } = classesInfo;
        if (!server) return () => {};
        
        const socket = createAuthSockette(`${server}/connections`, secret, {
          timeout: 5000,
          onmessage(event) {
            try {
              const data = JSON.parse(event.data);
              // 处理连接数据，计算当前上传下载速度
              next(null, (prev: any = { connections: [], uploadTotal: 0, downloadTotal: 0 }) => {
                const oldConns = prev.connections || [];
                const newConns = data.connections || [];
                
                // 计算当前速度
                const processedConns = newConns.map((conn: any) => {
                  const oldConn = oldConns.find((old: any) => old.id === conn.id);
                  if (oldConn) {
                    return {
                      ...conn,
                      curUpload: conn.upload - oldConn.upload,
                      curDownload: conn.download - oldConn.download
                    };
                  }
                  return { ...conn, curUpload: 0, curDownload: 0 };
                });
                
                return {
                  ...data,
                  connections: processedConns
                };
              });
            } catch (err) {
              console.error("[Connections] 解析数据错误:", err);
            }
          },
          onerror() {
            next(null, { connections: [], uploadTotal: 0, downloadTotal: 0 });
          }
        });
        
        return () => socket.close();
      }
    );
  
  // 流量和内存数据 - 通过WebSocket获取实时流量数据
  const { data: trafficData = { up: 0, down: 0 } } = useSWRSubscription(
    classesInfo && pageVisible ? "traffic" : null,
    (_key, { next }) => {
      if (!classesInfo || !pageVisible) return () => {};
      
      const { server = "", secret = "" } = classesInfo;
      if (!server) return () => {};
      
      const socket = createAuthSockette(`${server}/traffic`, secret, {
        onmessage(event) {
          try {
            const data = JSON.parse(event.data);
            next(null, data);
          } catch (err) {
            console.error("[Traffic] 解析数据错误:", err);
          }
        }
      });
      
      return () => socket.close();
    }
  );
  
  const { data: memoryData = { inuse: 0 } } = useSWRSubscription(
    classesInfo && pageVisible ? "memory" : null,
    (_key, { next }) => {
      if (!classesInfo || !pageVisible) return () => {};
      
      const { server = "", secret = "" } = classesInfo;
      if (!server) return () => {};
      
      const socket = createAuthSockette(`${server}/memory`, secret, {
        onmessage(event) {
          try {
            const data = JSON.parse(event.data);
            next(null, data);
          } catch (err) {
            console.error("[Memory] 解析数据错误:", err);
          }
        }
      });
      
      return () => socket.close();
    }
  );
  
  // 提供统一的刷新方法
  const refreshAll = async () => {
    await Promise.all([
      refreshProxy(),
      refreshclassesConfig(),
      refreshRules(),
      refreshSysproxy(),
      refreshProxyProviders(),
      refreshRuleProviders()
    ]);
  };
  
  // 聚合所有数据
  const value = useMemo(() => ({
    // 数据
    proxies: proxiesData,
    classesConfig,
    rules: rulesData || [],
    sysproxy,
    runningMode,
    uptime: uptimeData || 0,
    
    // 提供者数据
    proxyProviders: proxyProviders || {},
    ruleProviders: ruleProviders || {},
    
    // 连接数据
    connections: {
      data: connectionsData.connections || [],
      count: connectionsData.connections?.length || 0,
      uploadTotal: connectionsData.uploadTotal || 0,
      downloadTotal: connectionsData.downloadTotal || 0
    },
    
    // 实时流量数据
    traffic: trafficData,
    memory: memoryData,
    
    // 刷新方法
    refreshProxy,
    refreshclassesConfig,
    refreshRules,
    refreshSysproxy,
    refreshProxyProviders,
    refreshRuleProviders,
    refreshAll
  }), [
    proxiesData, classesConfig, rulesData, sysproxy, 
    runningMode, uptimeData, connectionsData,
    trafficData, memoryData, proxyProviders, ruleProviders,
    refreshProxy, refreshclassesConfig, refreshRules, refreshSysproxy,
    refreshProxyProviders, refreshRuleProviders
  ]);

  return (
    <AppDataContext.Provider value={value}>
      {children}
    </AppDataContext.Provider>
  );
};

// 自定义Hook访问全局数据
export const useAppData = () => {
  const context = useContext(AppDataContext);
  
  if (!context) {
    throw new Error("useAppData必须在AppDataProvider内使用");
  }
  
  return context;
}; 