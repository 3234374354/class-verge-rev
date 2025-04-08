import { forwardRef, useImperativeHandle, useState } from "react";
import { useLockFn } from "ahooks";
import { useTranslation } from "react-i18next";
import { List, ListItem, ListItemText, TextField } from "@mui/material";
import { useclassesInfo } from "@/hooks/use-classes";
import { BaseDialog, DialogRef, Notice } from "@/components/base";

export const ControllerViewer = forwardRef<DialogRef>((props, ref) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const { classesInfo, patchInfo } = useclassesInfo();

  const [controller, setController] = useState(classesInfo?.server || "");
  const [secret, setSecret] = useState(classesInfo?.secret || "");

  useImperativeHandle(ref, () => ({
    open: () => {
      setOpen(true);
      setController(classesInfo?.server || "");
      setSecret(classesInfo?.secret || "");
    },
    close: () => setOpen(false),
  }));

  const onSave = useLockFn(async () => {
    try {
      await patchInfo({ "external-controller": controller, secret });
      Notice.success(t("External Controller Address Modified"), 1000);
      setOpen(false);
    } catch (err: any) {
      Notice.error(err.message || err.toString(), 4000);
    }
  });

  return (
    <BaseDialog
      open={open}
      title={t("External Controller")}
      contentSx={{ width: 400 }}
      okBtn={t("Save")}
      cancelBtn={t("Cancel")}
      onClose={() => setOpen(false)}
      onCancel={() => setOpen(false)}
      onOk={onSave}
    >
      <List>
        <ListItem sx={{ padding: "5px 2px" }}>
          <ListItemText primary={t("External Controller")} />
          <TextField
            autoComplete="new-password"
            size="small"
            sx={{ width: 175 }}
            value={controller}
            placeholder="Required"
            onChange={(e) => setController(e.target.value)}
          />
        </ListItem>

        <ListItem sx={{ padding: "5px 2px" }}>
          <ListItemText primary={t("Core Secret")} />
          <TextField
            autoComplete="new-password"
            size="small"
            sx={{ width: 175 }}
            value={secret}
            placeholder={t("Recommended")}
            onChange={(e) =>
              setSecret(e.target.value?.replace(/[^\x00-\x7F]/g, ""))
            }
          />
        </ListItem>
      </List>
    </BaseDialog>
  );
});
