import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { invoke } from "@tauri-apps/api/core";

interface AppInfo {
  name: string;
  version: string;
  author: string;
  copyright: string;
}

interface UpdateInfo {
  has_update: boolean;
  current_version: string;
  latest_version: string;
  download_url: string;
  body: string;
}

type UpdateStatus = "idle" | "available" | "downloading" | "error";

const GITHUB_REPO = "https://github.com/wwnetboy/ViClip";

export function AboutSection() {
  const { t } = useTranslation();
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null);
  const [status, setStatus] = useState<UpdateStatus>("idle");
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    invoke<AppInfo>("get_app_info").then(setAppInfo).catch(console.error);

    invoke<UpdateInfo>("check_update")
      .then((info) => {
        setUpdateInfo(info);
        if (info.has_update) {
          setStatus("available");
        }
      })
      .catch((err) => {
        console.warn("Update check failed:", err);
      });
  }, []);

  const handleDownload = useCallback(async () => {
    if (!updateInfo?.download_url) return;
    setStatus("downloading");
    setErrorMsg("");
    try {
      await invoke("download_and_install_update", { url: updateInfo.download_url });
    } catch (err) {
      setErrorMsg(String(err));
      setStatus("error");
    }
  }, [updateInfo]);

  const handleRetry = useCallback(async () => {
    setStatus("idle");
    setErrorMsg("");
    try {
      const info = await invoke<UpdateInfo>("check_update");
      setUpdateInfo(info);
      if (info.has_update) {
        setStatus("available");
      }
    } catch (err) {
      setErrorMsg(String(err));
      setStatus("error");
    }
  }, []);

  const handleOpenGitHub = useCallback(() => {
    invoke("open_url", { url: GITHUB_REPO }).catch(console.error);
  }, []);

  return (
    <div className="settings-section">
      <div className="settings-section-title">{t("settings.about")}</div>
      <div className="settings-card">
        <div className="settings-row">
          <div className="settings-row-label">{t("settings.version")}</div>
          <div className="about-version-row">
            <span className="about-version">
              v{appInfo?.version ?? "—"}
            </span>
            {status === "available" && updateInfo && (
              <span className="about-latest-badge">
                v{updateInfo.latest_version} {t("settings.updateAvailable")}
              </span>
            )}
          </div>
        </div>

        <div className="settings-row">
          <div className="settings-row-label">{t("settings.copyright")}</div>
          <span className="about-secondary">
            {appInfo?.copyright ?? "—"}
          </span>
        </div>

        <div className="settings-row">
          <div className="settings-row-label">GitHub</div>
          <button className="about-link-btn" onClick={handleOpenGitHub}>
            {GITHUB_REPO}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="about-external-icon">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </button>
        </div>

        {/* Update available section */}
        {status === "available" && updateInfo && (
          <div className="settings-row about-update-row">
            <div className="about-update-available">
              {updateInfo.body && (
                <pre className="about-release-notes">{updateInfo.body}</pre>
              )}
              <button className="about-download-btn" onClick={handleDownload}>
                {t("settings.downloadUpdate")}
              </button>
            </div>
          </div>
        )}

        {/* Downloading */}
        {status === "downloading" && (
          <div className="settings-row about-update-row">
            <span className="about-status downloading">{t("settings.downloading")}</span>
          </div>
        )}

        {/* Error */}
        {status === "error" && (
          <div className="settings-row about-update-row">
            <div className="about-update-error">
              <span className="about-error-msg">{errorMsg}</span>
              <button className="about-retry-btn" onClick={handleRetry}>
                {t("common.retry")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
