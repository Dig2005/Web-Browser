import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { STORAGE_KEYS } from "../constants/storageKeys";

import { getStoredData, saveStoredData } from "../utils/storage";
import { useAuth } from "./AuthContext";

import { fetchSettings, updateSettings } from "../services/settingService";

const BrowserContext = createContext(null);

const DEFAULT_SETTINGS = {
  searchEngine: "bing",
  theme: "dark",
  startupMode: "home",
  startupUrl: "",
  downloadPath: "",
  askDownloadLocation: false,
  switchToNewTab: true,
  newTabPage: "home",
};

function generateTabId() {
  return `tab-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createTab(id = generateTabId()) {
  return {
    id,
    title: "New Tab",
    url: "browser://new-tab",
    internalPage: "home",
    favicon: null,
    loading: false,
    canGoBack: false,
    canGoForward: false,
    zoomFactor: 1,
    zoomPercentage: 100,

    find: {
      open: false,
      query: "",
      matches: 0,
      activeMatch: 0,
    },

    entries: [],
    activeIndex: -1,
    cameFromDashboard: true,
    dashboardForwardUrl: null,
  };
}

function createSessionTab(tab) {
  return {
    id: tab.id,

    title: tab.title || "New Tab",

    url: tab.url || "browser://new-tab",

    internalPage: tab.internalPage || "home",

    favicon: tab.favicon || null,

    zoomFactor: Number.isFinite(tab.zoomFactor) ? tab.zoomFactor : 1,
  };
}

function getStoredSession() {
  const stored = getStoredData(STORAGE_KEYS.session, null);

  if (
    !stored ||
    typeof stored !== "object" ||
    !Array.isArray(stored.tabs) ||
    stored.tabs.length === 0
  ) {
    return null;
  }

  const validTabs = stored.tabs.filter((tab) => {
    if (!tab || typeof tab !== "object") {
      return false;
    }

    if (typeof tab.id !== "string" || !tab.id) {
      return false;
    }

    if (typeof tab.url !== "string") {
      return false;
    }

    return true;
  });

  if (validTabs.length === 0) {
    return null;
  }

  const activeTabExists = validTabs.some(
    (tab) => tab.id === stored.activeTabId,
  );

  return {
    activeTabId: activeTabExists ? stored.activeTabId : validTabs[0].id,

    tabs: validTabs,
  };
}

function createRestoredTab(savedTab) {
  const tab = createTab(savedTab.id);

  tab.title = savedTab.title || "New Tab";

  tab.url = savedTab.url || "browser://new-tab";

  tab.internalPage = savedTab.internalPage || "home";

  tab.favicon = savedTab.favicon || null;

  tab.zoomFactor = Number.isFinite(savedTab.zoomFactor)
    ? savedTab.zoomFactor
    : 1;

  tab.zoomPercentage = Math.round(tab.zoomFactor * 100);

  tab.entries = Array.isArray(savedTab.entries) ? savedTab.entries : [];

  tab.activeIndex = Number.isInteger(savedTab.activeIndex)
    ? savedTab.activeIndex
    : -1;

  tab.cameFromDashboard = savedTab.cameFromDashboard ?? true;

  tab.dashboardForwardUrl = savedTab.dashboardForwardUrl ?? null;

  return tab;
}
function normalizeRemoteSettings(remote, local) {
  return {
    ...DEFAULT_SETTINGS,
    ...local,
    searchEngine: remote?.searchEngine ?? local.searchEngine,
    theme: remote?.theme ?? local.theme,
    startupMode: remote?.startupMode ?? local.startupMode,
    startupUrl: remote?.startupUrl ?? local.startupUrl,
    askDownloadLocation:
      remote?.askDownloadLocation ?? local.askDownloadLocation,
    switchToNewTab: remote?.switchToNewTab ?? local.switchToNewTab,
  };
}
export function BrowserProvider({ children }) {
  const { isAuthenticated, user } = useAuth();
  const [settings, setSettings] = useState(() => {
    const stored = getStoredData(STORAGE_KEYS.settings, {});

    return {
      ...DEFAULT_SETTINGS,

      ...(stored && typeof stored === "object" ? stored : {}),
    };
  });
  const [settingsSyncing, setSettingsSyncing] = useState(false);

  const [settingsSyncError, setSettingsSyncError] = useState("");

  const accountSettingsLoadedRef = useRef(false);
  const searchEngine = ["google", "bing", "duckduckgo"].includes(
    settings.searchEngine,
  )
    ? settings.searchEngine
    : "bing";

  const theme = ["dark", "light", "system"].includes(settings.theme)
    ? settings.theme
    : "dark";

  const startupMode = ["home", "continue", "custom"].includes(
    settings.startupMode,
  )
    ? settings.startupMode
    : "home";

  const startupUrl =
    typeof settings.startupUrl === "string" ? settings.startupUrl : "";

  const downloadPath =
    typeof settings.downloadPath === "string" ? settings.downloadPath : "";

  const askDownloadLocation = Boolean(settings.askDownloadLocation);

  const switchToNewTab = settings.switchToNewTab !== false;

  const newTabPage = settings.newTabPage === "home" ? "home" : "home";
  useEffect(() => {
    let cancelled = false;

    const loadAccountSettings = async () => {
      if (!isAuthenticated) {
        accountSettingsLoadedRef.current = false;

        setSettingsSyncError("");

        const local = getStoredData(STORAGE_KEYS.settings, {});

        if (!cancelled) {
          setSettings({
            ...DEFAULT_SETTINGS,

            ...(local && typeof local === "object" ? local : {}),
          });
        }

        return;
      }

      setSettingsSyncing(true);

      setSettingsSyncError("");

      try {
        const remote = await fetchSettings();

        if (cancelled) {
          return;
        }

        setSettings((current) => normalizeRemoteSettings(remote, current));

        accountSettingsLoadedRef.current = true;
      } catch (requestError) {
        if (!cancelled) {
          setSettingsSyncError(
            requestError?.message || "Unable to load account settings.",
          );
        }
      } finally {
        if (!cancelled) {
          setSettingsSyncing(false);
        }
      }
    };

    loadAccountSettings();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user?.id]);
  const persistSettings = useCallback(
    async (nextSettings) => {
      saveStoredData(STORAGE_KEYS.settings, nextSettings);

      if (!isAuthenticated || !accountSettingsLoadedRef.current) {
        return;
      }

      try {
        setSettingsSyncError("");

        await updateSettings({
          searchEngine: nextSettings.searchEngine,

          theme: nextSettings.theme,

          startupMode: nextSettings.startupMode,

          startupUrl: nextSettings.startupUrl,

          askDownloadLocation: nextSettings.askDownloadLocation,

          switchToNewTab: nextSettings.switchToNewTab,
        });
      } catch (requestError) {
        setSettingsSyncError(
          requestError?.message || "Unable to synchronize settings.",
        );
      }
    },
    [isAuthenticated],
  );
  const setSearchEngine = useCallback(
    (engine) => {
      const allowedEngines = ["google", "bing", "duckduckgo"];

      if (!allowedEngines.includes(engine)) {
        return;
      }

      setSettings((current) => {
        const next = {
          ...current,
          searchEngine: engine,
        };

        persistSettings(next);

        return next;
      });
    },
    [persistSettings],
  );

  const setTheme = useCallback(
    (nextTheme) => {
      const allowedThemes = ["dark", "light", "system"];

      if (!allowedThemes.includes(nextTheme)) {
        return;
      }

      setSettings((current) => {
        const next = {
          ...current,
          theme: nextTheme,
        };

        persistSettings(next);

        return next;
      });
    },
    [persistSettings],
  );

  const [systemTheme, setSystemTheme] = useState(() => {
    if (typeof window === "undefined" || !window.matchMedia) {
      return "dark";
    }

    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  });

  const resolvedTheme = theme === "system" ? systemTheme : theme;

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleThemeChange = (event) => {
      setSystemTheme(event.matches ? "dark" : "light");
    };

    setSystemTheme(mediaQuery.matches ? "dark" : "light");

    mediaQuery.addEventListener("change", handleThemeChange);

    return () => {
      mediaQuery.removeEventListener("change", handleThemeChange);
    };
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", resolvedTheme);

    document.documentElement.style.colorScheme = resolvedTheme;
  }, [resolvedTheme]);
  const setStartupMode = useCallback(
    (mode) => {
      const allowedModes = ["home", "continue", "custom"];

      if (!allowedModes.includes(mode)) {
        return;
      }

      setSettings((current) => {
        const next = {
          ...current,
          startupMode: mode,
        };

        persistSettings(next);

        return next;
      });
    },
    [persistSettings],
  );
  const setStartupUrl = useCallback(
    (url) => {
      setSettings((current) => {
        const next = {
          ...current,

          startupUrl: typeof url === "string" ? url : "",
        };

        persistSettings(next);

        return next;
      });
    },
    [persistSettings],
  );

  const setDownloadPath = useCallback((path) => {
    setSettings((current) => {
      const next = {
        ...current,
        downloadPath: path || "",
      };

      saveStoredData(STORAGE_KEYS.settings, next);

      return next;
    });
  }, []);

  const setAskDownloadLocation = useCallback(
    (enabled) => {
      setSettings((current) => {
        const next = {
          ...current,

          askDownloadLocation: Boolean(enabled),
        };

        persistSettings(next);

        return next;
      });
    },
    [persistSettings],
  );

  const chooseDownloadFolder = useCallback(async () => {
    const result =
      await window.browserAPI?.windowControls?.selectDownloadFolder();

    if (!result?.success || !result.path) {
      return;
    }

    setDownloadPath(result.path);
  }, [setDownloadPath]);

  const setSwitchToNewTab = useCallback(
    (enabled) => {
      setSettings((current) => {
        const next = {
          ...current,

          switchToNewTab: Boolean(enabled),
        };

        persistSettings(next);

        return next;
      });
    },
    [persistSettings],
  );

  const initialSessionRef = useRef(undefined);

  if (initialSessionRef.current === undefined) {
    initialSessionRef.current =
      startupMode === "continue" ? getStoredSession() : null;
  }

  const initialTabsRef = useRef(null);

  if (!initialTabsRef.current) {
    if (initialSessionRef.current?.tabs?.length > 0) {
      initialTabsRef.current =
        initialSessionRef.current.tabs.map(createRestoredTab);
    } else {
      initialTabsRef.current = [createTab("tab-1")];
    }
  }

  const initialActiveTabIdRef = useRef(null);

  if (!initialActiveTabIdRef.current) {
    const savedActiveTabId = initialSessionRef.current?.activeTabId;

    const activeExists = initialTabsRef.current.some(
      (tab) => tab.id === savedActiveTabId,
    );

    initialActiveTabIdRef.current = activeExists
      ? savedActiveTabId
      : initialTabsRef.current[0].id;
  }

  const startupConfigRef = useRef({
    startupMode,
    startupUrl,
    searchEngine,
  });

  const [tabs, setTabs] = useState(initialTabsRef.current);

  const [activeTabId, setActiveTabId] = useState(initialActiveTabIdRef.current);

  const [addressValue, setAddressValue] = useState("");

  const [navigationError, setNavigationError] = useState("");

  const [sessionInitialized, setSessionInitialized] = useState(false);

  const tabsRef = useRef(tabs);

  const activeTabIdRef = useRef(activeTabId);

  const closedTabsRef = useRef([]);

  const sessionReadyRef = useRef(false);

  const sessionSaveTimerRef = useRef(null);

  const createNewTabRef = useRef(null);

  const switchToNewTabRef = useRef(switchToNewTab);

  useEffect(() => {
    tabsRef.current = tabs;
  }, [tabs]);

  useEffect(() => {
    activeTabIdRef.current = activeTabId;
  }, [activeTabId]);

  useEffect(() => {
    switchToNewTabRef.current = switchToNewTab;
  }, [switchToNewTab]);

  const activeTab = useMemo(() => {
    return tabs.find((tab) => tab.id === activeTabId) || tabs[0] || null;
  }, [tabs, activeTabId]);

  const updateTab = useCallback((tabId, changes) => {
    setTabs((currentTabs) => {
      const nextTabs = currentTabs.map((tab) =>
        tab.id === tabId
          ? {
              ...tab,
              ...changes,
            }
          : tab,
      );

      tabsRef.current = nextTabs;

      return nextTabs;
    });
  }, []);

  const displayTab = useCallback(async (tab) => {
    if (!tab) {
      return;
    }

    setNavigationError("");

    if (tab.url === "browser://new-tab") {
      setAddressValue("");

      await window.browserAPI?.tabs?.showDashboard(tab.id);

      return;
    }

    setAddressValue(tab.url);

    await window.browserAPI?.tabs?.show(tab.id);
  }, []);

  const saveCurrentSession = useCallback(async () => {
    if (!sessionReadyRef.current) {
      return;
    }

    const reactTabs = tabsRef.current;

    if (reactTabs.length === 0) {
      return;
    }

    let electronSession = {
      activeTabId: null,
      tabs: [],
    };

    try {
      const result = await window.browserAPI?.tabs?.getSessionSnapshot();

      if (result) {
        electronSession = result;
      }
    } catch (error) {
      console.error("Failed to get session snapshot:", error);
    }

    const electronTabs = Array.isArray(electronSession?.tabs)
      ? electronSession.tabs
      : [];

    const sessionTabs = reactTabs.map((tab) => {
      const electronTab = electronTabs.find((item) => item.id === tab.id);

      return {
        ...createSessionTab(tab),

        entries: Array.isArray(electronTab?.entries) ? electronTab.entries : [],

        activeIndex: Number.isInteger(electronTab?.activeIndex)
          ? electronTab.activeIndex
          : -1,

        cameFromDashboard:
          electronTab?.cameFromDashboard ?? tab.cameFromDashboard ?? true,

        dashboardForwardUrl:
          electronTab?.dashboardForwardUrl ?? tab.dashboardForwardUrl ?? null,
      };
    });

    const session = {
      version: 1,

      activeTabId: activeTabIdRef.current,

      tabs: sessionTabs,

      savedAt: new Date().toISOString(),
    };

    saveStoredData(STORAGE_KEYS.session, session);
  }, []);

  useEffect(() => {
    if (!sessionInitialized || !sessionReadyRef.current) {
      return;
    }

    if (sessionSaveTimerRef.current) {
      window.clearTimeout(sessionSaveTimerRef.current);
    }

    sessionSaveTimerRef.current = window.setTimeout(() => {
      saveCurrentSession();
    }, 250);

    return () => {
      if (sessionSaveTimerRef.current) {
        window.clearTimeout(sessionSaveTimerRef.current);
      }
    };
  }, [tabs, activeTabId, sessionInitialized, saveCurrentSession]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      saveCurrentSession();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [saveCurrentSession]);

  useEffect(() => {
    const removeTabStateListener = window.browserAPI?.events?.onTabState?.(
      (state) => {
        if (!state?.id) {
          return;
        }

        const currentTab = tabsRef.current.find((tab) => tab.id === state.id);

        updateTab(state.id, {
          title: state.title || "New Tab",

          url: state.url || "browser://new-tab",

          favicon: state.favicon || null,

          loading: Boolean(state.loading),

          canGoBack: Boolean(state.canGoBack),

          canGoForward: Boolean(state.canGoForward),

          zoomFactor: Number.isFinite(state.zoomFactor)
            ? state.zoomFactor
            : (currentTab?.zoomFactor ?? 1),

          zoomPercentage: Number.isFinite(state.zoomPercentage)
            ? state.zoomPercentage
            : (currentTab?.zoomPercentage ?? 100),
        });

        if (state.id === activeTabIdRef.current) {
          setAddressValue(
            state.url === "browser://new-tab" ? "" : state.url || "",
          );
        }
      },
    );

    const removeErrorListener = window.browserAPI?.events?.onNavigationError?.(
      (error) => {
        if (error?.tabId !== activeTabIdRef.current) {
          return;
        }

        setNavigationError(
          error?.errorDescription || "The page could not be loaded.",
        );
      },
    );

    const removeNewTabListener = window.browserAPI?.events?.onNewTabRequested?.(
      (payload) => {
        const url = typeof payload === "string" ? payload : payload?.url;

        if (!url) {
          return;
        }

        createNewTabRef.current?.(url, {
          activate: switchToNewTabRef.current,
        });
      },
    );

    const removeFindResultListener = window.browserAPI?.events?.onFindResult?.(
      (result) => {
        if (!result?.tabId) {
          return;
        }

        setTabs((currentTabs) => {
          const nextTabs = currentTabs.map((tab) => {
            if (tab.id !== result.tabId) {
              return tab;
            }

            return {
              ...tab,

              find: {
                ...tab.find,

                matches: Number(result.matches) || 0,

                activeMatch: Number(result.activeMatchOrdinal) || 0,
              },
            };
          });

          tabsRef.current = nextTabs;

          return nextTabs;
        });
      },
    );

    const removeZoomListener = window.browserAPI?.events?.onZoomState?.(
      (state) => {
        if (!state?.tabId) {
          return;
        }

        updateTab(state.tabId, {
          zoomFactor: Number.isFinite(state.zoomFactor) ? state.zoomFactor : 1,

          zoomPercentage: Number.isFinite(state.percentage)
            ? state.percentage
            : 100,
        });
      },
    );

    return () => {
      removeTabStateListener?.();
      removeErrorListener?.();
      removeNewTabListener?.();
      removeFindResultListener?.();
      removeZoomListener?.();
    };
  }, [updateTab]);

  useEffect(() => {
    let cancelled = false;

    const restoreStartup = async () => {
      const {
        startupMode: initialStartupMode,

        startupUrl: initialStartupUrl,

        searchEngine: initialSearchEngine,
      } = startupConfigRef.current;

      const currentTabs = tabsRef.current;

      if (currentTabs.length === 0) {
        sessionReadyRef.current = true;

        setSessionInitialized(true);

        return;
      }

      try {
        if (initialStartupMode === "custom" && initialStartupUrl.trim()) {
          const firstTab = currentTabs[0];

          await window.browserAPI?.tabs?.create(firstTab.id);

          if (cancelled) {
            return;
          }

          await window.browserAPI?.navigation?.navigate(
            firstTab.id,
            initialStartupUrl.trim(),
            initialSearchEngine,
          );

          if (cancelled) {
            return;
          }

          setActiveTabId(firstTab.id);

          activeTabIdRef.current = firstTab.id;

          setAddressValue(initialStartupUrl.trim());

          return;
        }

        for (const tab of currentTabs) {
          if (cancelled) {
            return;
          }

          await window.browserAPI?.tabs?.create(tab.id);

          if (
            initialStartupMode !== "continue" ||
            tab.url === "browser://new-tab"
          ) {
            continue;
          }

          await window.browserAPI?.tabs?.restore(tab.id, {
            title: tab.title,

            url: tab.url,

            favicon: tab.favicon,

            zoomFactor: tab.zoomFactor,

            entries: Array.isArray(tab.entries) ? tab.entries : [],

            activeIndex: Number.isInteger(tab.activeIndex)
              ? tab.activeIndex
              : -1,

            cameFromDashboard: tab.cameFromDashboard ?? true,

            dashboardForwardUrl: tab.dashboardForwardUrl ?? null,
          });
        }

        if (cancelled) {
          return;
        }

        const selectedTab =
          currentTabs.find((tab) => tab.id === activeTabIdRef.current) ||
          currentTabs[0];

        setActiveTabId(selectedTab.id);

        activeTabIdRef.current = selectedTab.id;

        if (selectedTab.url === "browser://new-tab") {
          await window.browserAPI?.tabs?.showDashboard(selectedTab.id);

          setAddressValue("");
        } else {
          await window.browserAPI?.tabs?.show(selectedTab.id);

          setAddressValue(selectedTab.url);
        }
      } catch (error) {
        console.error("Failed to restore Safora session:", error);

        const fallbackTab = tabsRef.current[0];

        if (fallbackTab) {
          await window.browserAPI?.tabs?.create(fallbackTab.id);

          await window.browserAPI?.tabs?.showDashboard(fallbackTab.id);

          updateTab(fallbackTab.id, {
            title: "New Tab",

            url: "browser://new-tab",

            internalPage: "home",

            loading: false,
          });

          setActiveTabId(fallbackTab.id);

          activeTabIdRef.current = fallbackTab.id;

          setAddressValue("");
        }
      } finally {
        if (!cancelled) {
          sessionReadyRef.current = true;

          setSessionInitialized(true);
        }
      }
    };

    restoreStartup();

    return () => {
      cancelled = true;
    };
  }, [updateTab]);

  const createNewTab = useCallback(
    async (initialUrl = null, options = {}) => {
      const activate = options.activate !== false;

      const previousTabId = activeTabIdRef.current;

      const newTab = createTab();

      setTabs((currentTabs) => {
        const nextTabs = [...currentTabs, newTab];

        tabsRef.current = nextTabs;

        return nextTabs;
      });

      setNavigationError("");

      await window.browserAPI?.tabs?.create(newTab.id);

      if (initialUrl) {
        await window.browserAPI?.navigation?.navigate(
          newTab.id,
          initialUrl,
          searchEngine,
        );
      } else {
        await window.browserAPI?.tabs?.showDashboard(newTab.id);
      }

      if (activate) {
        setActiveTabId(newTab.id);

        activeTabIdRef.current = newTab.id;

        setAddressValue(initialUrl || "");

        if (initialUrl) {
          await window.browserAPI?.tabs?.show(newTab.id);
        } else {
          await window.browserAPI?.tabs?.showDashboard(newTab.id);
        }
      } else {
        const previousTab = tabsRef.current.find(
          (tab) => tab.id === previousTabId,
        );

        if (previousTab) {
          await displayTab(previousTab);
        }
      }

      return newTab.id;
    },
    [displayTab, searchEngine],
  );

  useEffect(() => {
    createNewTabRef.current = createNewTab;
  }, [createNewTab]);

  const selectTab = useCallback(
    async (tabId) => {
      const selectedTab = tabsRef.current.find((tab) => tab.id === tabId);

      if (!selectedTab) {
        return;
      }

      setActiveTabId(tabId);

      activeTabIdRef.current = tabId;

      await displayTab(selectedTab);
    },
    [displayTab],
  );

  const selectTabByIndex = useCallback(
    async (index) => {
      const currentTabs = tabsRef.current;

      if (currentTabs.length === 0) {
        return;
      }

      const selectedTab =
        index === 8 ? currentTabs[currentTabs.length - 1] : currentTabs[index];

      if (!selectedTab) {
        return;
      }

      await selectTab(selectedTab.id);
    },
    [selectTab],
  );

  const closeTab = useCallback(
    async (tabId) => {
      const currentTabs = tabsRef.current;

      const closingIndex = currentTabs.findIndex((tab) => tab.id === tabId);

      if (closingIndex === -1) {
        return;
      }

      const closingTab = currentTabs[closingIndex];

      const result = await window.browserAPI?.tabs?.close(tabId);

      if (result?.snapshot) {
        const snapshot = {
          ...result.snapshot,

          internalPage: closingTab?.internalPage || "home",
        };

        closedTabsRef.current = [snapshot, ...closedTabsRef.current].slice(
          0,
          20,
        );
      }

      const remainingTabs = currentTabs.filter((tab) => tab.id !== tabId);

      if (remainingTabs.length === 0) {
        const replacement = createTab();

        setTabs([replacement]);

        tabsRef.current = [replacement];

        setActiveTabId(replacement.id);

        activeTabIdRef.current = replacement.id;

        setAddressValue("");

        await window.browserAPI?.tabs?.create(replacement.id);

        await window.browserAPI?.tabs?.showDashboard(replacement.id);

        return;
      }

      setTabs(remainingTabs);

      tabsRef.current = remainingTabs;

      if (activeTabIdRef.current !== tabId) {
        return;
      }

      const replacement =
        remainingTabs[Math.min(closingIndex, remainingTabs.length - 1)];

      await selectTab(replacement.id);
    },
    [selectTab],
  );

  const reopenClosedTab = useCallback(async () => {
    const [snapshot, ...remainingSnapshots] = closedTabsRef.current;

    if (!snapshot) {
      return;
    }

    closedTabsRef.current = remainingSnapshots;

    const reopenedTab = createTab();

    reopenedTab.title = snapshot.title || "New Tab";

    reopenedTab.url = snapshot.url || "browser://new-tab";

    reopenedTab.favicon = snapshot.favicon || null;

    reopenedTab.internalPage = snapshot.internalPage || "home";

    reopenedTab.zoomFactor = Number.isFinite(snapshot.zoomFactor)
      ? snapshot.zoomFactor
      : 1;

    reopenedTab.zoomPercentage = Math.round(reopenedTab.zoomFactor * 100);

    reopenedTab.entries = Array.isArray(snapshot.entries)
      ? snapshot.entries
      : [];

    reopenedTab.activeIndex = Number.isInteger(snapshot.activeIndex)
      ? snapshot.activeIndex
      : -1;

    reopenedTab.cameFromDashboard = snapshot.cameFromDashboard ?? true;

    reopenedTab.dashboardForwardUrl = snapshot.dashboardForwardUrl ?? null;

    const nextTabs = [...tabsRef.current, reopenedTab];

    setTabs(nextTabs);

    tabsRef.current = nextTabs;

    setActiveTabId(reopenedTab.id);

    activeTabIdRef.current = reopenedTab.id;

    setAddressValue(
      reopenedTab.url === "browser://new-tab" ? "" : reopenedTab.url,
    );

    const result = await window.browserAPI?.tabs?.restore(reopenedTab.id, {
      title: reopenedTab.title,

      url: reopenedTab.url,

      favicon: reopenedTab.favicon,

      zoomFactor: reopenedTab.zoomFactor,

      entries: reopenedTab.entries,

      activeIndex: reopenedTab.activeIndex,

      cameFromDashboard: reopenedTab.cameFromDashboard,

      dashboardForwardUrl: reopenedTab.dashboardForwardUrl,
    });

    if (result?.success === false) {
      setNavigationError("The closed tab could not be restored.");

      return;
    }

    if (reopenedTab.url === "browser://new-tab") {
      await window.browserAPI?.tabs?.showDashboard(reopenedTab.id);
    } else {
      await window.browserAPI?.tabs?.show(reopenedTab.id);
    }
  }, []);

  const navigate = useCallback(
    async (input) => {
      const value = typeof input === "string" ? input.trim() : "";

      if (!value || !activeTabIdRef.current) {
        return;
      }

      setNavigationError("");

      const result = await window.browserAPI?.navigation?.navigate(
        activeTabIdRef.current,
        value,
        searchEngine,
      );

      if (result?.success === false) {
        setNavigationError(result.message || "Navigation failed.");
      }
    },
    [searchEngine],
  );

  const goBack = useCallback(async () => {
    const tabId = activeTabIdRef.current;

    if (!tabId) {
      return;
    }

    const result = await window.browserAPI?.navigation?.back(tabId);

    if (result?.destination === "browser://new-tab") {
      const currentTab = tabsRef.current.find((tab) => tab.id === tabId);

      updateTab(tabId, {
        internalPage: "home",

        find: {
          ...currentTab?.find,
          open: false,
          query: "",
          matches: 0,
          activeMatch: 0,
        },
      });
    }
  }, [updateTab]);

  const goForward = useCallback(async () => {
    const tabId = activeTabIdRef.current;

    if (!tabId) {
      return;
    }

    await window.browserAPI?.navigation?.forward(tabId);
  }, []);

  const reloadOrStop = useCallback(() => {
    const currentTab = tabsRef.current.find(
      (tab) => tab.id === activeTabIdRef.current,
    );

    if (!currentTab) {
      return;
    }

    if (currentTab.loading) {
      window.browserAPI?.navigation?.stop(currentTab.id);

      return;
    }

    if (currentTab.url !== "browser://new-tab") {
      window.browserAPI?.navigation?.reload(currentTab.id);
    }
  }, []);

  const goHome = useCallback(async () => {
    const tabId = activeTabIdRef.current;

    if (!tabId) {
      return;
    }

    const currentTab = tabsRef.current.find((tab) => tab.id === tabId);

    updateTab(tabId, {
      title: "New Tab",

      url: "browser://new-tab",

      internalPage: "home",

      favicon: null,

      loading: false,

      canGoBack: false,

      canGoForward: false,

      find: {
        ...currentTab?.find,
        open: false,
        query: "",
        matches: 0,
        activeMatch: 0,
      },
    });

    setAddressValue("");
    setNavigationError("");

    await window.browserAPI?.tabs?.showDashboard(tabId);
  }, [updateTab]);

  const openInternalPage = useCallback(
    async (page) => {
      const tabId = activeTabIdRef.current;

      if (!tabId) {
        return;
      }

      const allowedPages = [
        "home",
        "bookmarks",
        "history",
        "downloads",
        "settings",
        "social",
        "videos",
        "shopping",
        "news",
        "tools",
        "travel",
      ];

      if (!allowedPages.includes(page)) {
        return;
      }

      const currentTab = tabsRef.current.find((tab) => tab.id === tabId);

      updateTab(tabId, {
        url: "browser://new-tab",

        internalPage: page,

        title:
          page === "home"
            ? "New Tab"
            : page.charAt(0).toUpperCase() + page.slice(1),

        favicon: null,

        loading: false,

        find: {
          ...currentTab?.find,
          open: false,
          query: "",
          matches: 0,
          activeMatch: 0,
        },
      });

      setAddressValue("");
      setNavigationError("");

      await window.browserAPI?.tabs?.showDashboard(tabId);
    },
    [updateTab],
  );

  const openFind = useCallback(() => {
    const tabId = activeTabIdRef.current;

    const currentTab = tabsRef.current.find((tab) => tab.id === tabId);

    if (!currentTab || currentTab.url === "browser://new-tab") {
      return;
    }

    updateTab(tabId, {
      find: {
        ...currentTab.find,
        open: true,
      },
    });
  }, [updateTab]);

  useEffect(() => {
    const removeListener = window.browserAPI?.events?.onOpenFindRequested?.(
      ({ tabId }) => {
        if (!tabId || tabId !== activeTabIdRef.current) {
          return;
        }

        openFind();
      },
    );

    return () => {
      removeListener?.();
    };
  }, [openFind]);

  const setFindQuery = useCallback(
    async (query) => {
      const tabId = activeTabIdRef.current;

      const currentTab = tabsRef.current.find((tab) => tab.id === tabId);

      if (!currentTab || currentTab.url === "browser://new-tab") {
        return;
      }

      updateTab(tabId, {
        find: {
          ...currentTab.find,
          open: true,
          query,
          matches: 0,
          activeMatch: 0,
        },
      });

      if (!query.trim()) {
        await window.browserAPI?.navigation?.stopFindInPage(
          tabId,
          "clearSelection",
        );

        return;
      }

      await window.browserAPI?.navigation?.findInPage(tabId, query, {
        forward: true,
        findNext: true,
        matchCase: false,
      });
    },
    [updateTab],
  );

  const findNext = useCallback(async () => {
    const tabId = activeTabIdRef.current;

    const currentTab = tabsRef.current.find((tab) => tab.id === tabId);

    const query = currentTab?.find?.query?.trim();

    if (!currentTab || !query || currentTab.url === "browser://new-tab") {
      return;
    }

    await window.browserAPI?.navigation?.findInPage(tabId, query, {
      forward: true,
      findNext: false,
      matchCase: false,
    });
  }, []);

  const findPrevious = useCallback(async () => {
    const tabId = activeTabIdRef.current;

    const currentTab = tabsRef.current.find((tab) => tab.id === tabId);

    const query = currentTab?.find?.query?.trim();

    if (!currentTab || !query || currentTab.url === "browser://new-tab") {
      return;
    }

    await window.browserAPI?.navigation?.findInPage(tabId, query, {
      forward: false,
      findNext: false,
      matchCase: false,
    });
  }, []);

  const closeFind = useCallback(async () => {
    const tabId = activeTabIdRef.current;

    const currentTab = tabsRef.current.find((tab) => tab.id === tabId);

    if (!currentTab) {
      return;
    }

    if (currentTab.url !== "browser://new-tab") {
      await window.browserAPI?.navigation?.stopFindInPage(
        tabId,
        "clearSelection",
      );
    }

    updateTab(tabId, {
      find: {
        ...currentTab.find,
        open: false,
        query: "",
        matches: 0,
        activeMatch: 0,
      },
    });
  }, [updateTab]);

  const focusAddressBar = useCallback(() => {
    window.dispatchEvent(new CustomEvent("safora:focus-address-bar"));
  }, []);

  const zoomIn = useCallback(async () => {
    const tabId = activeTabIdRef.current;

    const tab = tabsRef.current.find((item) => item.id === tabId);

    if (!tab || tab.url === "browser://new-tab") {
      return;
    }

    await window.browserAPI?.navigation?.zoomIn(tabId);
  }, []);

  const zoomOut = useCallback(async () => {
    const tabId = activeTabIdRef.current;

    const tab = tabsRef.current.find((item) => item.id === tabId);

    if (!tab || tab.url === "browser://new-tab") {
      return;
    }

    await window.browserAPI?.navigation?.zoomOut(tabId);
  }, []);

  const resetZoom = useCallback(async () => {
    const tabId = activeTabIdRef.current;

    const tab = tabsRef.current.find((item) => item.id === tabId);

    if (!tab || tab.url === "browser://new-tab") {
      return;
    }

    await window.browserAPI?.navigation?.resetZoom(tabId);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    await window.browserAPI?.windowControls?.toggleFullscreen();
  }, []);

  const value = useMemo(
    () => ({
      tabs,
      activeTab,
      activeTabId,

      settings,
      settingsSyncing,
      settingsSyncError,
      searchEngine,
      setSearchEngine,

      theme,
      resolvedTheme,
      setTheme,

      startupMode,
      startupUrl,
      setStartupMode,
      setStartupUrl,

      downloadPath,
      askDownloadLocation,
      setDownloadPath,
      setAskDownloadLocation,
      chooseDownloadFolder,

      switchToNewTab,
      newTabPage,
      setSwitchToNewTab,

      addressValue,
      navigationError,

      setAddressValue,
      setNavigationError,

      createNewTab,

      selectTab,
      selectTabByIndex,

      closeTab,
      reopenClosedTab,

      navigate,

      goBack,
      goForward,

      reloadOrStop,

      goHome,
      openInternalPage,

      openFind,
      closeFind,
      setFindQuery,
      findNext,
      findPrevious,

      focusAddressBar,

      zoomIn,
      zoomOut,
      resetZoom,

      toggleFullscreen,

      saveCurrentSession,
    }),
    [
      tabs,
      activeTab,
      activeTabId,

      settings,
      settingsSyncing,
      settingsSyncError,
      searchEngine,
      setSearchEngine,

      theme,
      resolvedTheme,
      setTheme,

      startupMode,
      startupUrl,
      setStartupMode,
      setStartupUrl,

      downloadPath,
      askDownloadLocation,
      setDownloadPath,
      setAskDownloadLocation,
      chooseDownloadFolder,

      switchToNewTab,
      newTabPage,
      setSwitchToNewTab,

      addressValue,
      navigationError,

      createNewTab,

      selectTab,
      selectTabByIndex,

      closeTab,
      reopenClosedTab,

      navigate,

      goBack,
      goForward,

      reloadOrStop,

      goHome,
      openInternalPage,

      openFind,
      closeFind,
      setFindQuery,
      findNext,
      findPrevious,

      focusAddressBar,

      zoomIn,
      zoomOut,
      resetZoom,

      toggleFullscreen,

      saveCurrentSession,
    ],
  );

  return (
    <BrowserContext.Provider value={value}>{children}</BrowserContext.Provider>
  );
}

export function useBrowser() {
  const context = useContext(BrowserContext);

  if (!context) {
    throw new Error("useBrowser must be used inside BrowserProvider");
  }

  return context;
}
