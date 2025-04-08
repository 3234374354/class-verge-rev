import useSWR from "swr";
import { useEffect } from "react";
import { useLockFn } from "ahooks";
import { useTranslation } from "react-i18next";
import { Box, Button, ButtonGroup } from "@mui/material";
import { closeAllConnections, getclassesConfig } from "@/services/api";
import { patchclassesConfig, patchclassesMode } from "@/services/cmds";
import { useVerge } from "@/hooks/use-verge";
import { BasePage } from "@/components/base";
import { ProxyGroups } from "@/components/proxy/proxy-groups";
import { ProviderButton } from "@/components/proxy/provider-button";

const ProxyPage = () => {
  const { t } = useTranslation();

  const { data: classesConfig, mutate: mutateclasses } = useSWR(
    "getclassesConfig",
    getclassesConfig,
    {
      revalidateOnFocus: false,
      revalidateIfStale: true,
      dedupingInterval: 1000,
      errorRetryInterval: 5000
    }
  );

  const { verge } = useVerge();

  const modeList = ["rule", "global", "direct"];

  const curMode = classesConfig?.mode?.toLowerCase();

  const onChangeMode = useLockFn(async (mode: string) => {
    // 断开连接
    if (mode !== curMode && verge?.auto_close_connection) {
      closeAllConnections();
    }
    await patchclassesMode(mode);
    mutateclasses();
  });

  useEffect(() => {
    if (curMode && !modeList.includes(curMode)) {
      onChangeMode("rule");
    }
  }, [curMode]);

  return (
    <BasePage
      full
      contentStyle={{ height: "101.5%" }}
      title={t("Proxy Groups")}
      header={
        <Box display="flex" alignItems="center" gap={1}>
          <ProviderButton />

          <ButtonGroup size="small">
            {modeList.map((mode) => (
              <Button
                key={mode}
                variant={mode === curMode ? "contained" : "outlined"}
                onClick={() => onChangeMode(mode)}
                sx={{ textTransform: "capitalize" }}
              >
                {t(mode)}
              </Button>
            ))}
          </ButtonGroup>
        </Box>
      }
    >
      <ProxyGroups mode={curMode!} />
    </BasePage>
  );
};

export default ProxyPage;
