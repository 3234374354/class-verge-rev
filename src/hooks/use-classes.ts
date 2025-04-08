import useSWR, { mutate } from "swr";
import { useLockFn } from "ahooks";
import { getAxios, getVersion } from "@/services/api";
import {
  getclassesInfo,
  patchclassesConfig,
  getRuntimeConfig,
} from "@/services/cmds";

export const useclasses = () => {
  const { data: classes, mutate: mutateclasses } = useSWR(
    "getRuntimeConfig",
    getRuntimeConfig,
  );

  const { data: versionData, mutate: mutateVersion } = useSWR(
    "getVersion",
    getVersion,
  );

  const patchclasses = useLockFn(async (patch: Partial<IConfigData>) => {
    await patchclassesConfig(patch);
    mutateclasses();
  });

  const version = versionData?.premium
    ? `${versionData.version} Premium`
    : versionData?.meta
      ? `${versionData.version} Mihomo`
      : versionData?.version || "-";

  return {
    classes,
    version,
    mutateclasses,
    mutateVersion,
    patchclasses,
  };
};

export const useclassesInfo = () => {
  const { data: classesInfo, mutate: mutateInfo } = useSWR(
    "getclassesInfo",
    getclassesInfo,
  );

  const patchInfo = async (
    patch: Partial<
      Pick<
        IConfigData,
        | "port"
        | "socks-port"
        | "mixed-port"
        | "redir-port"
        | "tproxy-port"
        | "external-controller"
        | "secret"
      >
    >,
  ) => {
    const hasInfo =
      patch["redir-port"] != null ||
      patch["tproxy-port"] != null ||
      patch["mixed-port"] != null ||
      patch["socks-port"] != null ||
      patch["port"] != null ||
      patch["external-controller"] != null ||
      patch.secret != null;

    if (!hasInfo) return;

    if (patch["redir-port"]) {
      const port = patch["redir-port"];
      if (port < 1000) {
        throw new Error("The port should not < 1000");
      }
      if (port > 65536) {
        throw new Error("The port should not > 65536");
      }
    }

    if (patch["tproxy-port"]) {
      const port = patch["tproxy-port"];
      if (port < 1000) {
        throw new Error("The port should not < 1000");
      }
      if (port > 65536) {
        throw new Error("The port should not > 65536");
      }
    }

    if (patch["mixed-port"]) {
      const port = patch["mixed-port"];
      if (port < 1000) {
        throw new Error("The port should not < 1000");
      }
      if (port > 65536) {
        throw new Error("The port should not > 65536");
      }
    }

    if (patch["socks-port"]) {
      const port = patch["socks-port"];
      if (port < 1000) {
        throw new Error("The port should not < 1000");
      }
      if (port > 65536) {
        throw new Error("The port should not > 65536");
      }
    }

    if (patch["port"]) {
      const port = patch["port"];
      if (port < 1000) {
        throw new Error("The port should not < 1000");
      }
      if (port > 65536) {
        throw new Error("The port should not > 65536");
      }
    }

    await patchclassesConfig(patch);
    mutateInfo();
    mutate("getclassesConfig");
    // 刷新接口
    getAxios(true);
  };

  return {
    classesInfo,
    mutateInfo,
    patchInfo,
  };
};
