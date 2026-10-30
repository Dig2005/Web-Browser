const { Menu, clipboard, WebContentsView } = require("electron");

const {
  resolveNavigationInput,
  validateExternalUrl,
} = require("./urlResolver.cjs");

const TOOLBAR_HEIGHT = 110;
const MIN_CONTENT_TOP = TOOLBAR_HEIGHT;
const MAX_CONTENT_TOP = 620;

const ZOOM_LEVELS = [
  0.5, 0.67, 0.75, 0.8, 0.9, 1, 1.1, 1.25, 1.5, 1.75, 2, 2.5, 3,
];

class TabManager {
  constructor(mainWindow) {
    this.mainWindow = mainWindow;

    this.tabs = new Map();

    this.activeTabId = null;

    this.handleWindowResize = this.handleWindowResize.bind(this);

    this.mainWindow.on("resize", this.handleWindowResize);
    this.destroyed = false;
  }
  hasTab(tabId) {
    return this.tabs.has(tabId);
  }

  getTab(tabId) {
    return this.tabs.get(tabId) ?? null;
  }

  getActiveTab() {
    if (!this.activeTabId) {
      return null;
    }

    return this.getTab(this.activeTabId);
  }

  createTab(tabId) {
    if (!tabId) {
      return null;
    }

    if (this.tabs.has(tabId)) {
      return this.getTab(tabId);
    }

    const view = new WebContentsView({
      webPreferences: {
        nodeIntegration: false,

        contextIsolation: true,

        sandbox: true,

        webSecurity: true,

        javascript: true,

        devTools: process.env.NODE_ENV === "development",
      },
    });

    view.setBackgroundColor("#ffffff");

    const webContents = view.webContents;

    if (typeof webContents.setZoomMode === "function") {
      try {
        webContents.setZoomMode("isolated");
      } catch {
        // Continue with normal zoom.
      }
    }

    const tab = {
      id: tabId,

      view,

      url: "browser://new-tab",

      contentTop: TOOLBAR_HEIGHT,

      title: "New Tab",

      favicon: null,

      loading: false,

      displayed: false,

      zoomFactor: 1,

      cameFromDashboard: true,

      dashboardForwardUrl: null,
    };

    this.tabs.set(tabId, tab);

    this.registerTabEvents(tab);

    return tab;
  }
  registerTabEvents(tab) {
    const webContents = tab.view.webContents;

    webContents.on("before-input-event", (event, input) => {
      if (input.type !== "keyDown") {
        return;
      }

      const key = input.key?.toLowerCase() || "";

      const code = input.code || "";

      const modifierKey = Boolean(input.control || input.meta);

      if (modifierKey && !input.alt && key === "f") {
        event.preventDefault();

        this.sendToReact("browser:open-find-requested", {
          tabId: tab.id,
        });
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
          this.mainWindow.webContents.focus();
        }

        return;
      }
      if (
        modifierKey &&
        !input.alt &&
        (key === "+" || key === "=" || code === "NumpadAdd")
      ) {
        event.preventDefault();

        this.zoomIn(tab.id);

        return;
      }
      if (
        modifierKey &&
        !input.alt &&
        (key === "-" || code === "NumpadSubtract")
      ) {
        event.preventDefault();

        this.zoomOut(tab.id);

        return;
      }
      if (modifierKey && !input.alt && (key === "0" || code === "Numpad0")) {
        event.preventDefault();

        this.resetZoom(tab.id);

        return;
      }
      if (key === "f11") {
        event.preventDefault();

        this.toggleFullscreen();

        return;
      }
    });
    webContents.on("context-menu", (_event, params) => {
      this.showContextMenu(tab, params);
    });
    webContents.on("did-start-loading", () => {
      tab.loading = true;

      this.sendTabState(tab);
    });

    webContents.on("did-finish-load", () => {
      tab.loading = false;

      this.updateTabFromWebContents(tab);

      this.sendHistoryEntry(tab);
    });

    webContents.on("did-stop-loading", () => {
      tab.loading = false;

      this.updateTabFromWebContents(tab);
    });
    webContents.on("found-in-page", (_event, result) => {
      this.sendToReact("browser:find-result", {
        tabId: tab.id,

        requestId: result.requestId,

        matches: result.matches,

        activeMatchOrdinal: result.activeMatchOrdinal,

        finalUpdate: result.finalUpdate,
      });
    });
    webContents.on("dom-ready", () => {
      this.updateTabFromWebContents(tab);

      this.applyStoredZoom(tab);
    });
    webContents.on("page-title-updated", (_event, title) => {
      const cleanTitle = title?.trim();

      if (!cleanTitle) {
        return;
      }

      tab.title = cleanTitle;

      this.sendTabState(tab);
    });
    webContents.on("page-favicon-updated", (_event, favicons) => {
      if (!Array.isArray(favicons) || favicons.length === 0) {
        return;
      }

      const favicon = favicons.find(
        (value) => typeof value === "string" && value.trim() !== "",
      );

      if (!favicon) {
        return;
      }

      tab.favicon = favicon;

      this.sendTabState(tab);
    });
    webContents.on("did-navigate", (_event, url) => {
      if (url) {
        tab.url = url;
      }

      tab.dashboardForwardUrl = null;

      this.updateTabFromWebContents(tab);
    });
    webContents.on("did-navigate-in-page", (_event, url) => {
      if (url) {
        tab.url = url;
      }

      this.updateTabFromWebContents(tab);
    });
    webContents.on(
      "did-redirect-navigation",
      (_event, url, _isInPlace, isMainFrame) => {
        if (!isMainFrame) {
          return;
        }

        if (url) {
          tab.url = url;
        }

        this.updateTabFromWebContents(tab);
      },
    );
    webContents.on(
      "did-fail-load",
      (_event, errorCode, errorDescription, validatedUrl, isMainFrame) => {
        if (!isMainFrame || errorCode === -3) {
          return;
        }

        tab.loading = false;

        if (!tab.title || tab.title === "Loading...") {
          tab.title = "Page failed to load";
        }

        this.sendNavigationError({
          tabId: tab.id,

          errorCode,

          errorDescription,

          url: validatedUrl,
        });

        this.sendTabState(tab);
      },
    );
    webContents.setWindowOpenHandler(({ url, disposition }) => {
      const safeUrl = validateExternalUrl(url);

      if (!safeUrl) {
        return {
          action: "deny",
        };
      }

      const shouldOpenNewTab =
        disposition === "background-tab" || disposition === "new-window";

      if (shouldOpenNewTab) {
        this.sendNewTabRequest(safeUrl);

        return {
          action: "deny",
        };
      }

      setImmediate(() => {
        if (webContents.isDestroyed()) {
          return;
        }

        this.navigate(tab.id, safeUrl, "bing");
      });

      return {
        action: "deny",
      };
    });
    webContents.on("will-navigate", (event, url) => {
      const safeUrl = validateExternalUrl(url);

      if (!safeUrl) {
        event.preventDefault();
      }
    });
  }
  findInPage(tabId, text, options = {}) {
    const tab = this.getTab(tabId);

    if (!tab || tab.url === "browser://new-tab") {
      return {
        success: false,
      };
    }

    const webContents = tab.view.webContents;

    if (webContents.isDestroyed()) {
      return {
        success: false,
      };
    }

    const query = typeof text === "string" ? text.trim() : "";

    if (!query) {
      webContents.stopFindInPage("clearSelection");

      return {
        success: true,

        cleared: true,
      };
    }

    const requestId = webContents.findInPage(query, {
      forward: options.forward !== false,

      findNext: Boolean(options.findNext),

      matchCase: Boolean(options.matchCase),
    });

    return {
      success: true,

      requestId,
    };
  }

  stopFindInPage(tabId, action = "clearSelection") {
    const tab = this.getTab(tabId);

    if (!tab) {
      return {
        success: false,
      };
    }

    const webContents = tab.view.webContents;

    if (webContents.isDestroyed()) {
      return {
        success: false,
      };
    }

    const allowedActions = new Set([
      "clearSelection",
      "keepSelection",
      "activateSelection",
    ]);

    const safeAction = allowedActions.has(action) ? action : "clearSelection";

    webContents.stopFindInPage(safeAction);

    return {
      success: true,
    };
  }
  setZoomFactor(tabId, factor) {
    const tab = this.getTab(tabId);

    if (!tab || tab.url === "browser://new-tab") {
      return {
        success: false,
      };
    }

    const webContents = tab.view.webContents;

    if (webContents.isDestroyed()) {
      return {
        success: false,
      };
    }

    const numericalFactor = Number(factor);

    if (!Number.isFinite(numericalFactor)) {
      return {
        success: false,
      };
    }

    const minimum = ZOOM_LEVELS[0];

    const maximum = ZOOM_LEVELS[ZOOM_LEVELS.length - 1];

    const zoomFactor = Math.max(minimum, Math.min(maximum, numericalFactor));

    webContents.setZoomFactor(zoomFactor);

    tab.zoomFactor = zoomFactor;

    this.sendZoomState(tab);

    return {
      success: true,

      zoomFactor,

      percentage: Math.round(zoomFactor * 100),
    };
  }

  zoomIn(tabId) {
    const tab = this.getTab(tabId);

    if (!tab || tab.url === "browser://new-tab") {
      return {
        success: false,
      };
    }

    const current = tab.zoomFactor || 1;

    const next = ZOOM_LEVELS.find((factor) => factor > current + 0.001);

    const target = next ?? ZOOM_LEVELS[ZOOM_LEVELS.length - 1];

    return this.setZoomFactor(tabId, target);
  }

  zoomOut(tabId) {
    const tab = this.getTab(tabId);

    if (!tab || tab.url === "browser://new-tab") {
      return {
        success: false,
      };
    }

    const current = tab.zoomFactor || 1;

    const previous = [...ZOOM_LEVELS]
      .reverse()
      .find((factor) => factor < current - 0.001);

    const target = previous ?? ZOOM_LEVELS[0];

    return this.setZoomFactor(tabId, target);
  }

  resetZoom(tabId) {
    return this.setZoomFactor(tabId, 1);
  }

  applyStoredZoom(tab) {
    if (!tab) {
      return;
    }

    const webContents = tab.view.webContents;

    if (webContents.isDestroyed()) {
      return;
    }

    const factor = Number.isFinite(tab.zoomFactor) ? tab.zoomFactor : 1;

    try {
      webContents.setZoomFactor(factor);
    } catch {
      tab.zoomFactor = 1;
    }
  }

  sendZoomState(tab) {
    if (!tab) {
      return;
    }

    const zoomFactor = tab.zoomFactor || 1;

    this.sendToReact("browser:zoom-state", {
      tabId: tab.id,

      zoomFactor,

      percentage: Math.round(zoomFactor * 100),
    });
  }
  toggleFullscreen() {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) {
      return {
        success: false,

        fullscreen: false,
      };
    }

    const fullscreen = !this.mainWindow.isFullScreen();

    this.mainWindow.setFullScreen(fullscreen);

    return {
      success: true,

      fullscreen,
    };
  }
  showContextMenu(tab, params) {
    if (!tab || !params) {
      return;
    }

    const webContents = tab.view.webContents;

    if (!webContents || webContents.isDestroyed()) {
      return;
    }

    const template = [];

    const linkUrl = validateExternalUrl(params.linkURL);
    if (linkUrl) {
      template.push(
        {
          label: "Open Link",

          click: () => {
            this.navigate(tab.id, linkUrl, "bing");
          },
        },

        {
          label: "Open Link in New Tab",

          click: () => {
            this.sendNewTabRequest(linkUrl);
          },
        },

        {
          label: "Copy Link Address",

          click: () => {
            clipboard.writeText(linkUrl);
          },
        },

        {
          type: "separator",
        },
      );
    }
    if (params.isEditable) {
      template.push(
        {
          role: "undo",
        },

        {
          role: "redo",
        },

        {
          type: "separator",
        },

        {
          role: "cut",
        },

        {
          role: "copy",
        },

        {
          role: "paste",
        },

        {
          type: "separator",
        },

        {
          role: "selectAll",
        },

        {
          type: "separator",
        },
      );
    } else if (params.selectionText?.trim()) {
      template.push(
        {
          role: "copy",
        },

        {
          type: "separator",
        },
      );
    }
    const history = webContents.navigationHistory;

    template.push(
      {
        label: "Back",

        enabled:
          history.canGoBack() ||
          (tab.cameFromDashboard && tab.url !== "browser://new-tab"),

        click: () => {
          this.goBack(tab.id);
        },
      },

      {
        label: "Forward",

        enabled: history.canGoForward() || Boolean(tab.dashboardForwardUrl),

        click: () => {
          this.goForward(tab.id);
        },
      },

      {
        label: "Reload",

        enabled: tab.url !== "browser://new-tab",

        click: () => {
          this.reload(tab.id);
        },
      },

      {
        type: "separator",
      },

      {
        label: `Zoom: ${Math.round((tab.zoomFactor || 1) * 100)}%`,

        enabled: false,
      },

      {
        label: "Zoom In",

        click: () => {
          this.zoomIn(tab.id);
        },
      },

      {
        label: "Zoom Out",

        click: () => {
          this.zoomOut(tab.id);
        },
      },

      {
        label: "Reset Zoom",

        enabled: Math.abs((tab.zoomFactor || 1) - 1) > 0.001,

        click: () => {
          this.resetZoom(tab.id);
        },
      },
    );
    if (process.env.NODE_ENV === "development") {
      template.push(
        {
          type: "separator",
        },

        {
          label: "Inspect Element",

          click: () => {
            webContents.inspectElement(params.x, params.y);
          },
        },
      );
    }

    const menu = Menu.buildFromTemplate(template);

    menu.popup({
      window: this.mainWindow,
    });
  }

  sendHistoryEntry(tab) {
    if (!tab) {
      return;
    }

    const webContents = tab.view.webContents;

    if (webContents.isDestroyed()) {
      return;
    }

    const url = webContents.getURL();

    if (!url || !url.startsWith("http")) {
      return;
    }

    const title = webContents.getTitle()?.trim() || this.getFallbackTitle(url);

    this.sendToReact("browser:history-entry", {
      title,

      url,

      favicon: tab.favicon || null,

      visitedAt: new Date().toISOString(),
    });
  }

  getFallbackTitle(url) {
    try {
      const parsedUrl = new URL(url);

      return parsedUrl.hostname || "Web Page";
    } catch {
      return "Web Page";
    }
  }
  updateTabFromWebContents(tab) {
    if (!tab) {
      return;
    }

    const webContents = tab.view.webContents;

    if (webContents.isDestroyed()) {
      return;
    }

    const currentUrl = webContents.getURL();

    const currentTitle = webContents.getTitle()?.trim();

    if (currentUrl) {
      tab.url = currentUrl;
    }

    if (currentTitle) {
      tab.title = currentTitle;
    } else if (!tab.title || tab.title === "Loading...") {
      tab.title = this.getFallbackTitle(currentUrl);
    }

    const actualZoom = webContents.getZoomFactor();

    if (Number.isFinite(actualZoom)) {
      tab.zoomFactor = actualZoom;
    }

    this.sendTabState(tab);

    this.sendZoomState(tab);
  }

  getTabState(tab) {
    const webContents = tab.view.webContents;

    if (webContents.isDestroyed()) {
      return {
        id: tab.id,

        title: tab.title || "New Tab",

        url: tab.url || "browser://new-tab",

        favicon: tab.favicon || null,

        loading: false,

        canGoBack: false,

        canGoForward: Boolean(tab.dashboardForwardUrl),

        zoomFactor: tab.zoomFactor || 1,

        zoomPercentage: Math.round((tab.zoomFactor || 1) * 100),
      };
    }

    const history = webContents.navigationHistory;

    const canGoBack =
      tab.url !== "browser://new-tab" &&
      (history.canGoBack() || tab.cameFromDashboard);

    const canGoForward =
      history.canGoForward() || Boolean(tab.dashboardForwardUrl);

    return {
      id: tab.id,

      title: tab.title || "New Tab",

      url: tab.url || "browser://new-tab",

      favicon: tab.favicon || null,

      loading: Boolean(tab.loading),

      canGoBack,

      canGoForward,

      zoomFactor: tab.zoomFactor || 1,

      zoomPercentage: Math.round((tab.zoomFactor || 1) * 100),
    };
  }
  sendToReact(channel, payload) {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) {
      return;
    }

    const renderer = this.mainWindow.webContents;

    if (renderer.isDestroyed()) {
      return;
    }

    renderer.send(channel, payload);
  }

  sendTabState(tab) {
    this.sendToReact("browser:tab-state", this.getTabState(tab));
  }

  sendNavigationError(error) {
    this.sendToReact("browser:navigation-error", error);
  }

  sendNewTabRequest(url) {
    this.sendToReact("browser:new-tab-requested", {
      url,
    });
  }
  navigate(tabId, input, searchEngine = "bing") {
    const tab = this.getTab(tabId) ?? this.createTab(tabId);

    if (!tab) {
      return {
        success: false,

        message: "Unable to create the browser tab.",
      };
    }

    const resolvedUrl = resolveNavigationInput(input, searchEngine);

    if (!resolvedUrl) {
      return {
        success: false,

        message: "Enter a valid website address or search phrase.",
      };
    }

    if (tab.url === "browser://new-tab") {
      tab.cameFromDashboard = true;
    }

    this.clearFindForTab(tab);

    tab.dashboardForwardUrl = null;

    tab.url = resolvedUrl;

    tab.title = "Loading...";

    tab.favicon = null;

    tab.loading = true;

    tab.contentTop = TOOLBAR_HEIGHT;

    this.showTab(tabId);

    this.sendTabState(tab);

    tab.view.webContents
      .loadURL(resolvedUrl)
      .then(() => {
        tab.loading = false;

        this.applyStoredZoom(tab);

        this.updateTabFromWebContents(tab);
      })
      .catch((error) => {
        tab.loading = false;

        tab.title = "Page failed to load";

        this.sendNavigationError({
          tabId,

          errorCode: null,

          errorDescription: error.message,

          url: resolvedUrl,
        });

        this.sendTabState(tab);
      });

    return {
      success: true,

      url: resolvedUrl,
    };
  }

  clearFindForTab(tab) {
    if (!tab) {
      return;
    }

    const webContents = tab.view.webContents;

    if (webContents.isDestroyed()) {
      return;
    }

    try {
      webContents.stopFindInPage("clearSelection");
    } catch {
      // No active find request.
    }

    this.sendToReact("browser:find-result", {
      tabId: tab.id,

      requestId: 0,

      matches: 0,

      activeMatchOrdinal: 0,

      finalUpdate: true,
    });
  }
  showTab(tabId) {
    const tab = this.getTab(tabId) ?? this.createTab(tabId);

    if (!tab) {
      return;
    }

    this.hideAllTabs();

    this.activeTabId = tabId;

    tab.contentTop = TOOLBAR_HEIGHT;

    this.mainWindow.contentView.addChildView(tab.view);

    tab.displayed = true;

    this.updateViewBounds(tab);

    this.applyStoredZoom(tab);

    this.sendTabState(tab);

    this.sendZoomState(tab);
  }

  showNewTabDashboard(tabId) {
    this.hideAllTabs();

    this.activeTabId = tabId;

    const tab = this.getTab(tabId);

    if (!tab) {
      return;
    }

    this.clearFindForTab(tab);

    tab.url = "browser://new-tab";

    tab.title = "New Tab";

    tab.favicon = null;

    tab.loading = false;
    tab.contentTop = TOOLBAR_HEIGHT;
    tab.cameFromDashboard = true;

    tab.dashboardForwardUrl = null;

    this.sendTabState(tab);
  }

  hideAllTabs() {
    const canDetachViews = Boolean(
      this.mainWindow &&
      !this.mainWindow.isDestroyed() &&
      this.mainWindow.contentView,
    );

    for (const tab of this.tabs.values()) {
      if (!tab.displayed) {
        continue;
      }

      tab.displayed = false;

      if (!canDetachViews) {
        continue;
      }

      try {
        this.mainWindow.contentView.removeChildView(tab.view);
      } catch (error) {
        console.warn(`Unable to detach tab ${tab.id}:`, error.message);
      }
    }
  }
  hideTab(tabId) {
    const tab = this.getTab(tabId);

    if (!tab || !tab.displayed) {
      return;
    }

    tab.displayed = false;

    if (!this.mainWindow || this.mainWindow.isDestroyed()) {
      return;
    }

    const contentView = this.mainWindow.contentView;

    if (!contentView) {
      return;
    }

    try {
      contentView.removeChildView(tab.view);
    } catch (error) {
      console.warn(`Unable to detach tab ${tabId}:`, error.message);
    }
  }
  goBack(tabId) {
    const tab = this.getTab(tabId);

    if (!tab) {
      return {
        success: false,
      };
    }

    const webContents = tab.view.webContents;

    if (webContents.isDestroyed()) {
      return {
        success: false,
      };
    }

    const history = webContents.navigationHistory;

    if (history.canGoBack()) {
      this.clearFindForTab(tab);

      history.goBack();

      return {
        success: true,
      };
    }

    if (tab.cameFromDashboard && tab.url !== "browser://new-tab") {
      tab.dashboardForwardUrl = webContents.getURL() || tab.url;

      this.clearFindForTab(tab);

      this.hideAllTabs();

      tab.url = "browser://new-tab";

      tab.title = "New Tab";

      tab.favicon = null;

      tab.loading = false;

      this.activeTabId = tabId;

      this.sendTabState(tab);

      return {
        success: true,

        destination: "browser://new-tab",
      };
    }

    this.sendTabState(tab);

    return {
      success: false,
    };
  }

  goForward(tabId) {
    const tab = this.getTab(tabId);

    if (!tab) {
      return {
        success: false,
      };
    }

    const webContents = tab.view.webContents;

    if (webContents.isDestroyed()) {
      return {
        success: false,
      };
    }

    if (tab.url === "browser://new-tab" && tab.dashboardForwardUrl) {
      const forwardUrl = tab.dashboardForwardUrl;

      tab.dashboardForwardUrl = null;

      const existingUrl = webContents.getURL();

      tab.url = existingUrl || forwardUrl;

      const existingTitle = webContents.getTitle()?.trim();

      tab.title = existingTitle || this.getFallbackTitle(tab.url);

      tab.loading = webContents.isLoading();

      this.showTab(tabId);

      this.sendTabState(tab);

      return {
        success: true,
      };
    }

    const history = webContents.navigationHistory;

    if (history.canGoForward()) {
      this.clearFindForTab(tab);

      history.goForward();

      return {
        success: true,
      };
    }

    this.sendTabState(tab);

    return {
      success: false,
    };
  }
  reload(tabId) {
    const tab = this.getTab(tabId);

    if (!tab || tab.url === "browser://new-tab") {
      return {
        success: false,
      };
    }

    this.clearFindForTab(tab);

    tab.view.webContents.reload();

    return {
      success: true,
    };
  }

  stop(tabId) {
    const tab = this.getTab(tabId);

    if (!tab) {
      return {
        success: false,
      };
    }

    tab.view.webContents.stop();

    tab.loading = false;

    this.updateTabFromWebContents(tab);

    return {
      success: true,
    };
  }
  getTabSnapshot(tabId) {
    const tab = this.getTab(tabId);

    if (!tab) {
      return null;
    }

    const webContents = tab.view.webContents;

    if (!webContents || webContents.isDestroyed()) {
      return null;
    }

    const history = webContents.navigationHistory;

    let entries = [];
    let activeIndex = -1;

    try {
      entries = history.getAllEntries();

      activeIndex = history.getActiveIndex();
    } catch (error) {
      console.error("Failed to read tab history:", error);
    }

    let zoomFactor = Number.isFinite(tab.zoomFactor) ? tab.zoomFactor : 1;

    try {
      const currentZoom = webContents.getZoomFactor();

      if (Number.isFinite(currentZoom)) {
        zoomFactor = currentZoom;
      }
    } catch (error) {
      console.error("Failed to read tab zoom:", error);
    }

    return {
      title: tab.title || "New Tab",

      url: tab.url || "browser://new-tab",

      favicon: tab.favicon || null,

      zoomFactor,

      entries,

      activeIndex,

      cameFromDashboard: tab.cameFromDashboard ?? true,

      dashboardForwardUrl: tab.dashboardForwardUrl ?? null,
    };
  }
  getSessionSnapshot() {
    const tabs = [];

    for (const tab of this.tabs.values()) {
      const snapshot = this.getTabSnapshot(tab.id);

      if (!snapshot) {
        continue;
      }

      tabs.push({
        id: tab.id,
        ...snapshot,
      });
    }

    return {
      activeTabId: this.activeTabId || null,

      tabs,
    };
  }
  closeTab(tabId) {
    const tab = this.getTab(tabId);

    if (!tab) {
      return {
        success: false,
        snapshot: null,
      };
    }

    let snapshot = null;

    const webContents = tab.view?.webContents;

    if (webContents && !webContents.isDestroyed()) {
      snapshot = this.getTabSnapshot(tabId);
    }

    this.hideTab(tabId);

    if (webContents && !webContents.isDestroyed()) {
      try {
        webContents.close();
      } catch (error) {
        console.warn(`Unable to close tab ${tabId}:`, error.message);
      }
    }

    this.tabs.delete(tabId);

    if (this.activeTabId === tabId) {
      this.activeTabId = null;
    }

    return {
      success: true,
      snapshot,
    };
  }
  async restoreTab(tabId, snapshot) {
    if (!tabId || !snapshot) {
      return {
        success: false,
        message: "Invalid tab snapshot.",
      };
    }

    const existingTab = this.getTab(tabId);

    const tab = existingTab || this.createTab(tabId);

    if (!tab) {
      return {
        success: false,
        message: "Unable to create the restored tab.",
      };
    }

    const webContents = tab.view.webContents;

    if (!webContents || webContents.isDestroyed()) {
      return {
        success: false,
        message: "Restored tab contents are unavailable.",
      };
    }

    tab.title = snapshot.title || "New Tab";

    tab.url = snapshot.url || "browser://new-tab";

    tab.favicon = snapshot.favicon || null;

    tab.zoomFactor = Number.isFinite(snapshot.zoomFactor)
      ? snapshot.zoomFactor
      : 1;

    tab.loading = false;

    tab.cameFromDashboard = snapshot.cameFromDashboard ?? true;

    tab.dashboardForwardUrl = snapshot.dashboardForwardUrl ?? null;

    if (tab.url === "browser://new-tab") {
      this.showNewTabDashboard(tabId);

      return {
        success: true,
        destination: "browser://new-tab",
      };
    }

    const entries = Array.isArray(snapshot.entries) ? snapshot.entries : [];

    const activeIndex = Number.isInteger(snapshot.activeIndex)
      ? snapshot.activeIndex
      : -1;

    const history = webContents.navigationHistory;

    if (
      entries.length > 0 &&
      activeIndex >= 0 &&
      activeIndex < entries.length
    ) {
      try {
        await history.restore({
          entries,
          index: activeIndex,
        });

        this.applyStoredZoom(tab);

        this.updateTabFromWebContents(tab);

        return {
          success: true,
          restoredHistory: true,
        };
      } catch (error) {
        console.error("Failed to restore tab history:", error);
      }
    }

    const result = this.navigate(tabId, tab.url, "bing");

    if (result?.success) {
      this.applyStoredZoom(tab);
    }

    return result;
  }
  setContentTop(tabId, requestedTop) {
    const tab = this.getTab(tabId);

    if (!tab) {
      return {
        success: false,
        message: "Browser tab was not found.",
      };
    }

    const parsedTop = Number(requestedTop);

    const safeTop = Number.isFinite(parsedTop)
      ? Math.round(parsedTop)
      : TOOLBAR_HEIGHT;

    const contentTop = Math.max(
      MIN_CONTENT_TOP,
      Math.min(MAX_CONTENT_TOP, safeTop),
    );

    tab.contentTop = contentTop;

    if (tab.displayed) {
      this.updateViewBounds(tab);
    }

    return {
      success: true,
      contentTop,
    };
  }
  updateViewBounds(tab) {
    if (
      !tab ||
      !tab.displayed ||
      !this.mainWindow ||
      this.mainWindow.isDestroyed()
    ) {
      return;
    }

    const [width, height] = this.mainWindow.getContentSize();

    const requestedTop = Number(tab.contentTop);

    const contentTop = Number.isFinite(requestedTop)
      ? Math.max(MIN_CONTENT_TOP, Math.min(MAX_CONTENT_TOP, requestedTop))
      : TOOLBAR_HEIGHT;

    const availableHeight = Math.max(0, height - contentTop);

    tab.view.setBounds({
      x: 0,
      y: contentTop,
      width: Math.max(0, width),
      height: availableHeight,
    });
  }

  handleWindowResize() {
    const activeTab = this.getActiveTab();

    if (activeTab) {
      this.updateViewBounds(activeTab);
    }
  }
  destroy() {
    if (this.destroyed) {
      return;
    }
    this.destroyed = true;
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.removeListener("resize", this.handleWindowResize);
    }

    const canDetachViews = Boolean(
      this.mainWindow &&
      !this.mainWindow.isDestroyed() &&
      this.mainWindow.contentView,
    );

    for (const tab of this.tabs.values()) {
      tab.displayed = false;

      if (canDetachViews) {
        try {
          this.mainWindow.contentView.removeChildView(tab.view);
        } catch (error) {
          console.warn(
            `Unable to detach tab ${tab.id} during shutdown:`,
            error.message,
          );
        }
      }

      const webContents = tab.view?.webContents;

      if (webContents && !webContents.isDestroyed()) {
        try {
          webContents.close();
        } catch (error) {
          console.warn(
            `Unable to close tab ${tab.id} during shutdown:`,
            error.message,
          );
        }
      }
    }

    this.tabs.clear();

    this.activeTabId = null;
  }
}

module.exports = TabManager;
