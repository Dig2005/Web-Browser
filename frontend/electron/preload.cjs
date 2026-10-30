const { contextBridge, ipcRenderer } = require("electron");

function createEventSubscription(channel, callback) {
  if (typeof callback !== "function") {
    return () => {};
  }

  const listener = (_event, payload) => {
    callback(payload);
  };

  ipcRenderer.on(channel, listener);

  return () => {
    ipcRenderer.removeListener(channel, listener);
  };
}

contextBridge.exposeInMainWorld("browserAPI", {
  windowControls: {
    minimize: () => ipcRenderer.send("window:minimize"),

    toggleMaximize: () => ipcRenderer.send("window:toggle-maximize"),

    close: () => ipcRenderer.send("window:close"),

    isMaximized: () => {
      return ipcRenderer.invoke("window:is-maximized");
    },

    onMaximizedChange: (callback) => {
      return createEventSubscription("window:maximized-change", callback);
    },

    toggleFullscreen: () => {
      return ipcRenderer.invoke("window:toggle-fullscreen");
    },

    isFullscreen: () => {
      return ipcRenderer.invoke("window:is-fullscreen");
    },

    onFullscreenChange: (callback) => {
      return createEventSubscription("window:fullscreen-change", callback);
    },

    selectDownloadFolder: () => {
      return ipcRenderer.invoke("window:select-download-folder");
    },
  },

  tabs: {
    create: (tabId) => {
      return ipcRenderer.invoke("browser:create-tab", tabId);
    },

    show: (tabId) => {
      return ipcRenderer.invoke("browser:show-tab", tabId);
    },

    showDashboard: (tabId) => {
      return ipcRenderer.invoke("browser:show-dashboard", tabId);
    },

    close: (tabId) => {
      return ipcRenderer.invoke("browser:close-tab", tabId);
    },

    restore: (tabId, snapshot) => {
      return ipcRenderer.invoke("browser:restore-tab", {
        tabId,
        snapshot,
      });
    },

    getSessionSnapshot: () => {
      return ipcRenderer.invoke("browser:get-session-snapshot");
    },
  },

  layout: {
    setContentTop: (tabId, top) => {
      return ipcRenderer.invoke("browser:set-content-top", {
        tabId,
        top,
      });
    },

    resetContentTop: (tabId) => {
      return ipcRenderer.invoke("browser:set-content-top", {
        tabId,
        top: 110,
      });
    },
  },

  navigation: {
    navigate: (tabId, input, searchEngine = "bing") => {
      return ipcRenderer.invoke("browser:navigate", {
        tabId,
        input,
        searchEngine,
      });
    },

    back: (tabId) => {
      return ipcRenderer.invoke("browser:back", tabId);
    },

    forward: (tabId) => {
      return ipcRenderer.invoke("browser:forward", tabId);
    },

    reload: (tabId) => {
      return ipcRenderer.invoke("browser:reload", tabId);
    },

    stop: (tabId) => {
      return ipcRenderer.invoke("browser:stop", tabId);
    },

    findInPage: (tabId, text, options = {}) => {
      return ipcRenderer.invoke("browser:find-in-page", {
        tabId,
        text,
        options,
      });
    },

    stopFindInPage: (tabId, action = "clearSelection") => {
      return ipcRenderer.invoke("browser:stop-find", {
        tabId,
        action,
      });
    },

    zoomIn: (tabId) => {
      return ipcRenderer.invoke("browser:zoom-in", tabId);
    },

    zoomOut: (tabId) => {
      return ipcRenderer.invoke("browser:zoom-out", tabId);
    },

    resetZoom: (tabId) => {
      return ipcRenderer.invoke("browser:reset-zoom", tabId);
    },
  },

  downloads: {
    pause: (downloadId) => {
      return ipcRenderer.invoke("download:pause", downloadId);
    },

    resume: (downloadId) => {
      return ipcRenderer.invoke("download:resume", downloadId);
    },

    cancel: (downloadId) => {
      return ipcRenderer.invoke("download:cancel", downloadId);
    },

    openFile: (filePath) => {
      return ipcRenderer.invoke("download:open-file", filePath);
    },

    showInFolder: (filePath) => {
      return ipcRenderer.invoke("download:show-in-folder", filePath);
    },
  },

  events: {
    onTabState: (callback) => {
      return createEventSubscription("browser:tab-state", callback);
    },

    onNavigationError: (callback) => {
      return createEventSubscription("browser:navigation-error", callback);
    },

    onNewTabRequested: (callback) => {
      return createEventSubscription("browser:new-tab-requested", callback);
    },

    onFindResult: (callback) => {
      return createEventSubscription("browser:find-result", callback);
    },

    onOpenFindRequested: (callback) => {
      return createEventSubscription("browser:open-find-requested", callback);
    },

    onZoomState: (callback) => {
      return createEventSubscription("browser:zoom-state", callback);
    },

    onHistoryEntry: (callback) => {
      return createEventSubscription("browser:history-entry", callback);
    },

    onDownloadStarted: (callback) => {
      return createEventSubscription("download:started", callback);
    },

    onDownloadUpdated: (callback) => {
      return createEventSubscription("download:updated", callback);
    },

    onDownloadFinished: (callback) => {
      return createEventSubscription("download:finished", callback);
    },
  },
});
