import { CloudSun, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import HeroSection from "../../components/NewTab/HeroSection";
import MusicPlayer from "../../components/NewTab/MusicPlayer";
import QuickTools from "../../components/NewTab/QuickTools";
import Sidebar from "../../components/NewTab/Sidebar";
import TopStories from "../../components/NewTab/TopStories";
import TravelCard from "../../components/NewTab/TravelCard";
import { useBrowser } from "../../context/BrowserContext";
import { STORAGE_KEYS } from "../../constants/storageKeys";
import { getStoredData, saveStoredData } from "../../utils/storage";
import BookmarksPage from "../BookmarksPage/BookmarksPage";
import DownloadsPage from "../DownloadsPage/DownloadsPage";
import HistoryPage from "../HistoryPage/HistoryPage";
import SettingsPage from "../SettingsPage/SettingsPage";
import styles from "./NewTabPage.module.css";
import { useAuth } from "../../context/AuthContext";
import {
  createShortcut,
  deleteShortcut,
  fetchShortcuts,
  updateShortcut,
} from "../../services/shortcutService";
function getGreeting(date) {
  const hour = date.getHours();
  if (hour < 12) {
    return "Good Morning";
  }
  if (hour < 18) {
    return "Good Afternoon";
  }
  return "Good Evening";
}
function createShortcutId() {
  return `shortcut-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
function normalizeShortcutUrl(value) {
  const input = typeof value === "string" ? value.trim() : "";
  if (!input) {
    return null;
  }
  let candidate = input;
  if (!/^https?:\/\//i.test(candidate)) {
    candidate = `https://${candidate}`;
  }
  try {
    const url = new URL(candidate);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}
function NewTabPage() {
  const { activeTab, openInternalPage, navigate } = useBrowser();
  const { isAuthenticated, user } = useAuth();
  const activeItem = activeTab?.internalPage || "home";
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCurrentTime(new Date());
    }, 30000);
    return () => {
      window.clearInterval(intervalId);
    };
  }, []);
  const greeting = useMemo(() => getGreeting(currentTime), [currentTime]);
  const [shortcuts, setShortcuts] = useState(() => {
    const stored = getStoredData(STORAGE_KEYS.shortcuts, []);
    return Array.isArray(stored) ? stored : [];
  });
  const [shortcutsLoading, setShortcutsLoading] = useState(false);
  const [shortcutDialogOpen, setShortcutDialogOpen] = useState(false);
  const [editingShortcutId, setEditingShortcutId] = useState(null);
  const [shortcutName, setShortcutName] = useState("");
  const [shortcutUrl, setShortcutUrl] = useState("");
  const [shortcutError, setShortcutError] = useState("");
  useEffect(() => {
    let cancelled = false;
    const loadShortcuts = async () => {
      if (!isAuthenticated) {
        const stored = getStoredData(STORAGE_KEYS.shortcuts, []);
        if (!cancelled) {
          setShortcuts(Array.isArray(stored) ? stored : []);
          setShortcutsLoading(false);
        }
        return;
      }
      setShortcutsLoading(true);
      setShortcutError("");
      try {
        const result = await fetchShortcuts();
        if (!cancelled) {
          setShortcuts(Array.isArray(result) ? result : []);
        }
      } catch (requestError) {
        if (!cancelled) {
          setShortcutError(
            requestError?.message || "Unable to load shortcuts.",
          );
        }
      } finally {
        if (!cancelled) {
          setShortcutsLoading(false);
        }
      }
    };
    loadShortcuts();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user?.id]);
  const handleAddShortcut = () => {
    setEditingShortcutId(null);
    setShortcutName("");
    setShortcutUrl("");
    setShortcutError("");
    setShortcutDialogOpen(true);
  };
  const handleEditShortcut = (shortcut) => {
    if (!shortcut) {
      return;
    }
    setEditingShortcutId(shortcut.id);
    setShortcutName(shortcut.name || "");
    setShortcutUrl(shortcut.url || "");
    setShortcutError("");
    setShortcutDialogOpen(true);
  };
  const handleDeleteShortcut = async (shortcutId) => {
    if (!shortcutId) {
      return;
    }
    setShortcutError("");
    if (isAuthenticated) {
      try {
        await deleteShortcut(shortcutId);
        setShortcuts((current) =>
          current.filter((shortcut) => shortcut.id !== shortcutId),
        );
      } catch (requestError) {
        setShortcutError(requestError?.message || "Unable to delete shortcut.");
      }
      return;
    }
    setShortcuts((current) => {
      const next = current.filter((shortcut) => shortcut.id !== shortcutId);
      saveStoredData(STORAGE_KEYS.shortcuts, next);
      return next;
    });
  };
  const handleSaveShortcut = async (event) => {
    event.preventDefault();
    const name = shortcutName.trim();
    const normalizedUrl = normalizeShortcutUrl(shortcutUrl);
    if (!name) {
      setShortcutError("Enter a shortcut name.");
      return;
    }
    if (!normalizedUrl) {
      setShortcutError("Enter a valid website URL.");
      return;
    }
    setShortcutError("");
    if (isAuthenticated) {
      try {
        if (editingShortcutId) {
          const updated = await updateShortcut(editingShortcutId, {
            name,
            url: normalizedUrl,
          });
          setShortcuts((current) =>
            current.map((shortcut) =>
              shortcut.id === editingShortcutId ? updated : shortcut,
            ),
          );
        } else {
          const created = await createShortcut({
            name,
            url: normalizedUrl,
          });
          setShortcuts((current) => [...current, created]);
        }
        closeShortcutDialog();
      } catch (requestError) {
        setShortcutError(requestError?.message || "Unable to save shortcut.");
      }
      return;
    }
    setShortcuts((current) => {
      let next;
      if (editingShortcutId) {
        next = current.map((shortcut) =>
          shortcut.id === editingShortcutId
            ? {
                ...shortcut,
                name,
                url: normalizedUrl,
              }
            : shortcut,
        );
      } else {
        const newShortcut = {
          id: createShortcutId(),
          name,
          url: normalizedUrl,
        };
        next = [...current, newShortcut];
      }
      saveStoredData(STORAGE_KEYS.shortcuts, next);
      return next;
    });
    closeShortcutDialog();
  };
  const closeShortcutDialog = () => {
    setShortcutDialogOpen(false);
    setEditingShortcutId(null);
    setShortcutName("");
    setShortcutUrl("");
    setShortcutError("");
  };
  const handleOpenShortcut = async (shortcut) => {
    if (!shortcut?.url) {
      return;
    }
    await navigate(shortcut.url);
  };
  const renderInternalPage = (content) => {
    return (
      <div className={styles.newTabPage}>
        <Sidebar
          styles={styles}
          activeItem={activeItem}
          onItemChange={openInternalPage}
        />

        <main className={styles.dashboard}>{content}</main>
      </div>
    );
  };

  if (activeItem === "bookmarks") {
    return renderInternalPage(
      <BookmarksPage onBackHome={() => openInternalPage("home")} />,
    );
  }

  if (activeItem === "history") {
    return renderInternalPage(
      <HistoryPage onBackHome={() => openInternalPage("home")} />,
    );
  }

  if (activeItem === "downloads") {
    return renderInternalPage(
      <DownloadsPage onBackHome={() => openInternalPage("home")} />,
    );
  }
  if (activeItem === "settings") {
    return renderInternalPage(
      <SettingsPage onBackHome={() => openInternalPage("home")} />,
    );
  }
  if (activeItem !== "home") {
    return renderInternalPage(
      <section className={styles.sectionPlaceholder}>
        <h1>{activeItem.charAt(0).toUpperCase() + activeItem.slice(1)}</h1>

        <p>This section will be implemented in a later stage.</p>

        <button type="button" onClick={() => openInternalPage("home")}>
          Return to Home
        </button>
      </section>,
    );
  }
  return (
    <div className={styles.newTabPage}>
      <Sidebar
        styles={styles}
        activeItem={activeItem}
        onItemChange={openInternalPage}
      />

      <main className={styles.dashboard}>
        <div className={styles.dashboardHeader}>
          <div className={styles.dashboardLabel}>
            <span />
            Safora Home
          </div>

          <section className={styles.timeWeather}>
            <strong>
              {currentTime.toLocaleTimeString([], {
                hour: "numeric",
                minute: "2-digit",
              })}
            </strong>

            <CloudSun size={30} />
          </section>
        </div>

        <HeroSection
          styles={styles}
          greeting={greeting}
          shortcuts={shortcuts}
          onOpenShortcut={handleOpenShortcut}
          onAddShortcut={handleAddShortcut}
          onEditShortcut={handleEditShortcut}
          onDeleteShortcut={handleDeleteShortcut}
        />

        <div className={styles.middleGrid}>
          <TopStories styles={styles} />

          <QuickTools styles={styles} />
        </div>

        <div className={styles.bottomGrid}>
          <MusicPlayer styles={styles} />

          <TravelCard styles={styles} />
        </div>

        {shortcutDialogOpen && (
          <div
            className={styles.shortcutDialogBackdrop}
            onMouseDown={closeShortcutDialog}
          >
            <form
              className={styles.shortcutDialog}
              onSubmit={handleSaveShortcut}
              onMouseDown={(event) => {
                event.stopPropagation();
              }}
            >
              <div className={styles.shortcutDialogHeader}>
                <div>
                  <h2>
                    {editingShortcutId ? "Edit Shortcut" : "Add Shortcut"}
                  </h2>

                  <p>Add a website to Safora Home.</p>
                </div>

                <button
                  type="button"
                  className={styles.shortcutDialogClose}
                  onClick={closeShortcutDialog}
                  aria-label="Close"
                >
                  <X size={17} />
                </button>
              </div>

              <label className={styles.shortcutField}>
                <span>Name</span>

                <input
                  type="text"
                  value={shortcutName}
                  onChange={(event) => {
                    setShortcutName(event.target.value);

                    setShortcutError("");
                  }}
                  placeholder="GitHub"
                  maxLength={40}
                  autoFocus
                />
              </label>

              <label className={styles.shortcutField}>
                <span>URL</span>

                <input
                  type="text"
                  value={shortcutUrl}
                  onChange={(event) => {
                    setShortcutUrl(event.target.value);

                    setShortcutError("");
                  }}
                  placeholder="github.com"
                  spellCheck="false"
                  autoComplete="off"
                />
              </label>

              {shortcutError && (
                <p className={styles.shortcutError} role="alert">
                  {shortcutError}
                </p>
              )}

              <div className={styles.shortcutDialogActions}>
                <button
                  type="button"
                  className={styles.shortcutCancelButton}
                  onClick={closeShortcutDialog}
                >
                  Cancel
                </button>

                <button type="submit" className={styles.shortcutSaveButton}>
                  {editingShortcutId ? "Save Changes" : "Add Shortcut"}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}

export default NewTabPage;
