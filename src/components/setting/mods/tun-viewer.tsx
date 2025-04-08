import { forwardRef, useImperativeHandle, useState } from "react";
import { useLockFn } from "ahooks";
import { useTranslation } from "react-i18next";
import {
  List,
  ListItem,
  ListItemText,
  Box,
  Typography,
  Button,
  TextField,
} from "@mui/material";
import { useclasses } from "@/hooks/use-classes";
import { BaseDialog, DialogRef, Notice, Switch } from "@/components/base";
import { StackModeSwitch } from "./stack-mode-switch";
import { enhanceProfiles } from "@/services/cmds";

export const TunViewer = forwardRef<DialogRef>((props, ref) => {
  const { t } = useTranslation();

  const { classes, mutateclasses, patchclasses } = useclasses();

  const [open, setOpen] = useState(false);
  const [values, setValues] = useState({
    stack: "mixed",
    device: "Mihomo",
    autoRoute: true,
    autoDetectInterface: true,
    dnsHijack: ["any:53"],
    strictRoute: false,
    mtu: 1500,
  });

  useImperativeHandle(ref, () => ({
    open: () => {
      setOpen(true);
      setValues({
        stack: classes?.tun.stack ?? "gvisor",
        device: classes?.tun.device ?? "Mihomo",
        autoRoute: classes?.tun["auto-route"] ?? true,
        autoDetectInterface: classes?.tun["auto-detect-interface"] ?? true,
        dnsHijack: classes?.tun["dns-hijack"] ?? ["any:53"],
        strictRoute: classes?.tun["strict-route"] ?? false,
        mtu: classes?.tun.mtu ?? 1500,
      });
    },
    close: () => setOpen(false),
  }));

  const onSave = useLockFn(async () => {
    try {
      let tun = {
        stack: values.stack,
        device: values.device === "" ? "Mihomo" : values.device,
        "auto-route": values.autoRoute,
        "auto-detect-interface": values.autoDetectInterface,
        "dns-hijack": values.dnsHijack[0] === "" ? [] : values.dnsHijack,
        "strict-route": values.strictRoute,
        mtu: values.mtu ?? 1500,
      };
      await patchclasses({ tun });
      await mutateclasses(
        (old) => ({
          ...(old! || {}),
          tun,
        }),
        false,
      );
      try {
        await enhanceProfiles();
        Notice.success(t("Settings Applied"), 1000);
      } catch (err: any) {
        Notice.error(err.message || err.toString(), 3000);
      }
      setOpen(false);
    } catch (err: any) {
      Notice.error(err.message || err.toString());
    }
  });

  return (
    <BaseDialog
      open={open}
      title={
        <Box display="flex" justifyContent="space-between" gap={1}>
          <Typography variant="h6">{t("Tun Mode")}</Typography>
          <Button
            variant="outlined"
            size="small"
            onClick={async () => {
              let tun = {
                stack: "gvisor",
                device: "Mihomo",
                "auto-route": true,
                "auto-detect-interface": true,
                "dns-hijack": ["any:53"],
                "strict-route": false,
                mtu: 1500,
              };
              setValues({
                stack: "gvisor",
                device: "Mihomo",
                autoRoute: true,
                autoDetectInterface: true,
                dnsHijack: ["any:53"],
                strictRoute: false,
                mtu: 1500,
              });
              await patchclasses({ tun });
              await mutateclasses(
                (old) => ({
                  ...(old! || {}),
                  tun,
                }),
                false,
              );
            }}
          >
            {t("Reset to Default")}
          </Button>
        </Box>
      }
      contentSx={{ width: 450 }}
      okBtn={t("Save")}
      cancelBtn={t("Cancel")}
      onClose={() => setOpen(false)}
      onCancel={() => setOpen(false)}
      onOk={onSave}
    >
      <List>
        <ListItem sx={{ padding: "5px 2px" }}>
          <ListItemText primary={t("Stack")} />
          <StackModeSwitch
            value={values.stack}
            onChange={(value) => {
              setValues((v) => ({
                ...v,
                stack: value,
              }));
            }}
          />
        </ListItem>

        <ListItem sx={{ padding: "5px 2px" }}>
          <ListItemText primary={t("Device")} />
          <TextField
            autoComplete="new-password"
            size="small"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            sx={{ width: 250 }}
            value={values.device}
            placeholder="Mihomo"
            onChange={(e) =>
              setValues((v) => ({ ...v, device: e.target.value }))
            }
          />
        </ListItem>

        <ListItem sx={{ padding: "5px 2px" }}>
          <ListItemText primary={t("Auto Route")} />
          <Switch
            edge="end"
            checked={values.autoRoute}
            onChange={(_, c) => setValues((v) => ({ ...v, autoRoute: c }))}
          />
        </ListItem>

        <ListItem sx={{ padding: "5px 2px" }}>
          <ListItemText primary={t("Strict Route")} />
          <Switch
            edge="end"
            checked={values.strictRoute}
            onChange={(_, c) => setValues((v) => ({ ...v, strictRoute: c }))}
          />
        </ListItem>

        <ListItem sx={{ padding: "5px 2px" }}>
          <ListItemText primary={t("Auto Detect Interface")} />
          <Switch
            edge="end"
            checked={values.autoDetectInterface}
            onChange={(_, c) =>
              setValues((v) => ({ ...v, autoDetectInterface: c }))
            }
          />
        </ListItem>

        <ListItem sx={{ padding: "5px 2px" }}>
          <ListItemText primary={t("DNS Hijack")} />
          <TextField
            autoComplete="new-password"
            size="small"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            sx={{ width: 250 }}
            value={values.dnsHijack.join(",")}
            placeholder="Please use , to separate multiple DNS servers"
            onChange={(e) =>
              setValues((v) => ({ ...v, dnsHijack: e.target.value.split(",") }))
            }
          />
        </ListItem>

        <ListItem sx={{ padding: "5px 2px" }}>
          <ListItemText primary={t("MTU")} />
          <TextField
            autoComplete="new-password"
            size="small"
            type="number"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            sx={{ width: 250 }}
            value={values.mtu}
            placeholder="1500"
            onChange={(e) =>
              setValues((v) => ({
                ...v,
                mtu: parseInt(e.target.value),
              }))
            }
          />
        </ListItem>
      </List>
    </BaseDialog>
  );
});
