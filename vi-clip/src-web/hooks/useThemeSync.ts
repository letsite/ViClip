import { useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { resolveTheme, type ThemeMode } from "../stores/settingsStore";

export function useThemeSync(fromStore?: ThemeMode) {
  const mqCleanupRef = useRef<(() => void) | undefined>(undefined);

  const applyTheme = (mode: string) => {
    document.documentElement.setAttribute("data-theme", resolveTheme(mode as ThemeMode));

    if (mqCleanupRef.current) {
      mqCleanupRef.current();
      mqCleanupRef.current = undefined;
    }
    if (mode === "auto") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = () => {
        document.documentElement.setAttribute("data-theme", resolveTheme("auto"));
      };
      mq.addEventListener("change", handler);
      mqCleanupRef.current = () => mq.removeEventListener("change", handler);
    }
  };

  useEffect(() => {
    if (fromStore) {
      applyTheme(fromStore);
      return () => {
        if (mqCleanupRef.current) mqCleanupRef.current();
      };
    }

    // Standalone window: load theme from backend and listen for changes
    let unlistenTheme: UnlistenFn | undefined;

    invoke<string>("get_setting", { key: "theme" }).then((theme) => {
      if (theme) applyTheme(theme);
    }).catch(() => {});

    listen<{ theme: string }>("theme-changed", (e) => {
      applyTheme(e.payload.theme);
    }).then((fn) => { unlistenTheme = fn; });

    return () => {
      if (unlistenTheme) unlistenTheme();
      if (mqCleanupRef.current) mqCleanupRef.current();
    };
  }, [fromStore]);
}
