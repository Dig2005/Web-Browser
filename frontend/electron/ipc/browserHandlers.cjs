function registerBrowserHandlers(ipcMain, getTabManager) {
  function getManager() {
    const manager = getTabManager();
    return manager ?? null;
  }

  ipcMain.handle("browser:create-tab", (_event, tabId) => {
    const manager = getManager();

    if (!manager) {
      return {
        success: false,
        message: "Tab manager is unavailable.",
      };
    }

    const tab = manager.createTab(tabId);

    return {
      success: Boolean(tab),
    };
  });

  ipcMain.handle("browser:set-content-top", (_event, payload = {}) => {
    const manager = getManager();

    if (!manager) {
      return {
        success: false,
        message: "Tab manager is unavailable.",
      };
    }

    return manager.setContentTop(payload.tabId, payload.top);
  });

  ipcMain.handle("browser:zoom-in", (_event, tabId) => {
    const manager = getManager();

    return manager
      ? manager.zoomIn(tabId)
      : {
          success: false,
        };
  });

  ipcMain.handle("browser:zoom-out", (_event, tabId) => {
    const manager = getManager();

    return manager
      ? manager.zoomOut(tabId)
      : {
          success: false,
        };
  });

  ipcMain.handle("browser:reset-zoom", (_event, tabId) => {
    const manager = getManager();

    return manager
      ? manager.resetZoom(tabId)
      : {
          success: false,
        };
  });

  ipcMain.handle(
    "browser:navigate",
    (_event, { tabId, input, searchEngine }) => {
      const manager = getManager();

      if (!manager) {
        return {
          success: false,
          message: "Tab manager is unavailable.",
        };
      }

      return manager.navigate(tabId, input, searchEngine);
    },
  );

  ipcMain.handle("browser:find-in-page", (_event, { tabId, text, options }) => {
    const manager = getManager();

    if (!manager) {
      return {
        success: false,
      };
    }

    return manager.findInPage(tabId, text, options);
  });

  ipcMain.handle("browser:stop-find", (_event, { tabId, action }) => {
    const manager = getManager();

    if (!manager) {
      return {
        success: false,
      };
    }

    return manager.stopFindInPage(tabId, action);
  });

  ipcMain.handle("browser:show-tab", (_event, tabId) => {
    const manager = getManager();

    if (!manager) {
      return {
        success: false,
        message: "Tab manager is unavailable.",
      };
    }

    manager.showTab(tabId);

    return {
      success: true,
    };
  });

  ipcMain.handle("browser:show-dashboard", (_event, tabId) => {
    const manager = getManager();

    if (!manager) {
      return {
        success: false,
        message: "Tab manager is unavailable.",
      };
    }

    manager.showNewTabDashboard(tabId);

    return {
      success: true,
    };
  });

  ipcMain.handle("browser:close-tab", (_event, tabId) => {
    const manager = getManager();

    if (!manager) {
      return {
        success: false,
        message: "Tab manager is unavailable.",
        snapshot: null,
      };
    }

    return manager.closeTab(tabId);
  });

  ipcMain.handle("browser:restore-tab", async (_event, { tabId, snapshot }) => {
    const manager = getManager();

    if (!manager) {
      return {
        success: false,
        message: "Tab manager is unavailable.",
      };
    }

    return manager.restoreTab(tabId, snapshot);
  });

  ipcMain.handle("browser:back", (_event, tabId) => {
    const manager = getManager();

    if (!manager) {
      return {
        success: false,
        message: "Tab manager is unavailable.",
      };
    }

    return manager.goBack(tabId);
  });

  ipcMain.handle("browser:forward", (_event, tabId) => {
    const manager = getManager();

    if (!manager) {
      return {
        success: false,
        message: "Tab manager is unavailable.",
      };
    }

    return manager.goForward(tabId);
  });

  ipcMain.handle("browser:reload", (_event, tabId) => {
    const manager = getManager();

    if (!manager) {
      return {
        success: false,
        message: "Tab manager is unavailable.",
      };
    }

    return manager.reload(tabId);
  });

  ipcMain.handle("browser:stop", (_event, tabId) => {
    const manager = getManager();

    if (!manager) {
      return {
        success: false,
        message: "Tab manager is unavailable.",
      };
    }

    return manager.stop(tabId);
  });

  ipcMain.handle("browser:get-session-snapshot", () => {
    const manager = getManager();

    if (!manager) {
      return {
        activeTabId: null,
        tabs: [],
      };
    }

    return manager.getSessionSnapshot();
  });
}

module.exports = {
  registerBrowserHandlers,
};
