import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookOpen,
  Download,
  Expand,
  History,
  Home,
  LogOut,
  MoreVertical,
  Plus,
  Puzzle,
  RefreshCw,
  Search,
  Settings,
  UserRound,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

import { useEffect, useRef, useState } from "react";
import { useBrowser } from "../../context/BrowserContext";
import { useAuth } from "../../context/AuthContext";
import { useBookmarks } from "../../context/BookmarkContext";
import { useDownloads } from "../../context/DownloadContext";

import AddressBar from "./AddressBar";
import LoginPage from "../../pages/LoginPage/LoginPage";
import RegisterPage from "../../pages/RegisterPage/RegisterPage";

import styles from "./BrowserToolbar.module.css";

const NORMAL_CONTENT_TOP = 110;
const PROFILE_MENU_CONTENT_TOP = 390;
const BROWSER_MENU_CONTENT_TOP = 520;

function BrowserToolbar() {
  const {
    activeTab,
    createNewTab,
    goBack,
    goForward,
    reloadOrStop,
    goHome,
    openInternalPage,
    openFind,
    zoomIn,
    zoomOut,
    resetZoom,
    toggleFullscreen,
  } = useBrowser();

  const { user, isAuthenticated, logout, clearError } = useAuth();

  const { addBookmark, removeBookmarkByUrl, isBookmarked } = useBookmarks();

  const { activeDownloadCount } = useDownloads();

  const [profileOpen, setProfileOpen] = useState(false);
  const [browserMenuOpen, setBrowserMenuOpen] = useState(false);
  const [authView, setAuthView] = useState(null);

  const profileRef = useRef(null);
  const browserMenuRef = useRef(null);

  const isNewTab = activeTab?.url === "browser://new-tab";

  const bookmarked =
    activeTab &&
    activeTab.url !== "browser://new-tab" &&
    isBookmarked(activeTab.url);

  const setBrowserContentTop = async (top) => {
    if (!activeTab?.id || isNewTab) {
      return;
    }

    try {
      await window.browserAPI?.layout?.setContentTop(activeTab.id, top);
    } catch (error) {
      console.error("Unable to update browser content bounds:", error);
    }
  };

  const restoreBrowserContent = async () => {
    await setBrowserContentTop(NORMAL_CONTENT_TOP);
  };

  const closeMenus = async () => {
    setProfileOpen(false);
    setBrowserMenuOpen(false);
    await restoreBrowserContent();
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      const clickedInsideProfile =
        profileRef.current && profileRef.current.contains(event.target);

      const clickedInsideBrowserMenu =
        browserMenuRef.current && browserMenuRef.current.contains(event.target);

      if (!clickedInsideProfile && !clickedInsideBrowserMenu) {
        setProfileOpen(false);
        setBrowserMenuOpen(false);
        restoreBrowserContent();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [activeTab?.id, isNewTab]);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key !== "Escape") {
        return;
      }

      if (authView) {
        clearError();
        setAuthView(null);
      }

      setProfileOpen(false);
      setBrowserMenuOpen(false);
      restoreBrowserContent();
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [activeTab?.id, authView, clearError, isNewTab]);

  useEffect(() => {
    setProfileOpen(false);
    setBrowserMenuOpen(false);
    restoreBrowserContent();

    return () => {
      restoreBrowserContent();
    };
  }, [activeTab?.id]);

  const handleDownloadsClick = async () => {
    await closeMenus();
    await openInternalPage("downloads");
  };

  const handleInternalPage = async (page) => {
    await closeMenus();
    await openInternalPage(page);
  };

  const toggleBookmark = () => {
    if (!activeTab || activeTab.url === "browser://new-tab") {
      return;
    }

    if (bookmarked) {
      removeBookmarkByUrl(activeTab.url);
      return;
    }

    addBookmark({
      title: activeTab.title,
      url: activeTab.url,
      favicon: activeTab.favicon,
    });
  };

  const handleProfileButton = async () => {
    const willOpen = !profileOpen;

    setBrowserMenuOpen(false);
    setProfileOpen(willOpen);

    if (willOpen) {
      await setBrowserContentTop(PROFILE_MENU_CONTENT_TOP);
    } else {
      await restoreBrowserContent();
    }
  };

  const handleBrowserMenuButton = async () => {
    const willOpen = !browserMenuOpen;

    setProfileOpen(false);
    setBrowserMenuOpen(willOpen);

    if (willOpen) {
      await setBrowserContentTop(BROWSER_MENU_CONTENT_TOP);
    } else {
      await restoreBrowserContent();
    }
  };

  const handleOpenLogin = async () => {
    await closeMenus();
    clearError();
    setAuthView("login");
  };

  const handleOpenRegister = async () => {
    await closeMenus();
    clearError();
    setAuthView("register");
  };

  const handleLogout = async () => {
    logout();
    await closeMenus();
    setAuthView(null);
  };

  const handleAuthSuccess = async () => {
    clearError();
    setAuthView(null);
    await closeMenus();
  };

  const handleAuthCancel = () => {
    clearError();
    setAuthView(null);
  };

  const handleNewTab = async () => {
    await closeMenus();
    await createNewTab();
  };

  const handleFind = async () => {
    await closeMenus();
    openFind();
  };

  const handleFullscreen = async () => {
    await closeMenus();
    await toggleFullscreen();
  };

  const zoomPercentage =
    activeTab?.zoomPercentage ?? Math.round((activeTab?.zoomFactor ?? 1) * 100);

  const displayName =
    user?.name?.trim() || user?.email?.trim() || "Safora User";

  const profileInitial = displayName.charAt(0).toUpperCase() || "S";

  return (
    <>
      <div className={styles.toolbar}>
        <section className={styles.navigationControls}>
          <button
            type="button"
            className={styles.toolbarButton}
            onClick={goBack}
            disabled={!activeTab?.canGoBack}
            title="Back"
            aria-label="Back"
          >
            <ArrowLeft size={20} />
          </button>

          <button
            type="button"
            className={styles.toolbarButton}
            onClick={goForward}
            disabled={!activeTab?.canGoForward}
            title="Forward"
            aria-label="Forward"
          >
            <ArrowRight size={20} />
          </button>

          <button
            type="button"
            className={styles.toolbarButton}
            onClick={reloadOrStop}
            disabled={isNewTab}
            title={activeTab?.loading ? "Stop loading" : "Reload"}
            aria-label={activeTab?.loading ? "Stop loading" : "Reload"}
          >
            {activeTab?.loading ? <X size={19} /> : <RefreshCw size={19} />}
          </button>

          <button
            type="button"
            className={styles.toolbarButton}
            onClick={goHome}
            title="Safora Home"
            aria-label="Safora Home"
          >
            <Home size={20} />
          </button>
        </section>

        <AddressBar />

        <section className={styles.browserActions}>
          <button
            type="button"
            className={`${styles.toolbarButton} ${
              bookmarked ? styles.bookmarkedButton : ""
            }`}
            onClick={toggleBookmark}
            disabled={!activeTab || isNewTab}
            title={bookmarked ? "Remove bookmark" : "Bookmark this page"}
            aria-label={bookmarked ? "Remove bookmark" : "Bookmark this page"}
          >
            <Bookmark size={20} fill={bookmarked ? "currentColor" : "none"} />
          </button>

          <button
            type="button"
            className={styles.toolbarButton}
            title="Extensions"
            aria-label="Extensions"
          >
            <Puzzle size={19} />
          </button>

          <button
            type="button"
            className={styles.toolbarButton}
            onClick={handleDownloadsClick}
            title="Downloads"
            aria-label="Downloads"
          >
            <span className={styles.downloadButtonContent}>
              <ArrowDownToLine size={20} />

              {activeDownloadCount > 0 && (
                <span className={styles.downloadBadge}>
                  {activeDownloadCount > 9 ? "9+" : activeDownloadCount}
                </span>
              )}
            </span>
          </button>

          <div ref={profileRef} className={styles.menuWrapper}>
            <button
              type="button"
              className={styles.profileButton}
              onClick={handleProfileButton}
              title="Profile"
              aria-label="Profile"
              aria-expanded={profileOpen}
              aria-haspopup="menu"
            >
              {isAuthenticated ? (
                <span className={styles.profileInitial}>{profileInitial}</span>
              ) : (
                <UserRound size={20} />
              )}
            </button>

            {profileOpen && (
              <div className={styles.profileMenu} role="menu">
                {isAuthenticated ? (
                  <>
                    <div className={styles.profileHeader}>
                      <div className={styles.profileAvatar}>
                        {profileInitial}
                      </div>

                      <div className={styles.profileDetails}>
                        <strong>{displayName}</strong>

                        {user?.email && <span>{user.email}</span>}
                      </div>
                    </div>

                    <div className={styles.menuDivider} />

                    <button
                      type="button"
                      className={styles.menuItem}
                      onClick={() => handleInternalPage("settings")}
                      role="menuitem"
                    >
                      <Settings size={17} />
                      <span>Account & Settings</span>
                    </button>

                    <button
                      type="button"
                      className={`${styles.menuItem} ${styles.logoutItem}`}
                      onClick={handleLogout}
                      role="menuitem"
                    >
                      <LogOut size={17} />
                      <span>Sign Out</span>
                    </button>
                  </>
                ) : (
                  <>
                    <div className={styles.signedOutProfile}>
                      <div className={styles.profileAvatar}>
                        <UserRound size={20} />
                      </div>

                      <div>
                        <strong>Safora Account</strong>
                        <span>Sign in to access your account.</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className={styles.signInButton}
                      onClick={handleOpenLogin}
                    >
                      Sign In
                    </button>

                    <button
                      type="button"
                      className={styles.createAccountButton}
                      onClick={handleOpenRegister}
                    >
                      Create Account
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          <div ref={browserMenuRef} className={styles.menuWrapper}>
            <button
              type="button"
              className={styles.toolbarButton}
              onClick={handleBrowserMenuButton}
              title="Safora Browser menu"
              aria-label="Safora Browser menu"
              aria-expanded={browserMenuOpen}
              aria-haspopup="menu"
            >
              <MoreVertical size={20} />
            </button>

            {browserMenuOpen && (
              <div className={styles.browserMenu} role="menu">
                <button
                  type="button"
                  className={styles.menuItem}
                  onClick={handleNewTab}
                  role="menuitem"
                >
                  <Plus size={17} />
                  <span>New Tab</span>
                </button>

                <div className={styles.menuDivider} />

                <button
                  type="button"
                  className={styles.menuItem}
                  onClick={() => handleInternalPage("bookmarks")}
                  role="menuitem"
                >
                  <BookOpen size={17} />
                  <span>Bookmarks</span>
                </button>

                <button
                  type="button"
                  className={styles.menuItem}
                  onClick={() => handleInternalPage("history")}
                  role="menuitem"
                >
                  <History size={17} />
                  <span>History</span>
                </button>

                <button
                  type="button"
                  className={styles.menuItem}
                  onClick={handleDownloadsClick}
                  role="menuitem"
                >
                  <Download size={17} />
                  <span>Downloads</span>
                </button>

                <div className={styles.menuDivider} />

                <button
                  type="button"
                  className={styles.menuItem}
                  onClick={handleFind}
                  disabled={isNewTab}
                  role="menuitem"
                >
                  <Search size={17} />
                  <span>Find in Page</span>
                  <kbd>Ctrl+F</kbd>
                </button>

                <div className={styles.zoomRow}>
                  <span>Zoom</span>

                  <div>
                    <button
                      type="button"
                      onClick={zoomOut}
                      disabled={isNewTab}
                      title="Zoom out"
                    >
                      <ZoomOut size={16} />
                    </button>

                    <button
                      type="button"
                      className={styles.zoomPercentage}
                      onClick={resetZoom}
                      disabled={isNewTab}
                      title="Reset zoom"
                    >
                      {zoomPercentage}%
                    </button>

                    <button
                      type="button"
                      onClick={zoomIn}
                      disabled={isNewTab}
                      title="Zoom in"
                    >
                      <ZoomIn size={16} />
                    </button>
                  </div>
                </div>

                <div className={styles.menuDivider} />

                <button
                  type="button"
                  className={styles.menuItem}
                  onClick={() => handleInternalPage("settings")}
                  role="menuitem"
                >
                  <Settings size={17} />
                  <span>Settings</span>
                </button>

                <button
                  type="button"
                  className={styles.menuItem}
                  onClick={handleFullscreen}
                  role="menuitem"
                >
                  <Expand size={17} />
                  <span>Fullscreen</span>
                  <kbd>F11</kbd>
                </button>
              </div>
            )}
          </div>
        </section>
      </div>

      {authView && (
        <div className={styles.authOverlay} onMouseDown={handleAuthCancel}>
          <div
            className={styles.authOverlayContent}
            onMouseDown={(event) => {
              event.stopPropagation();
            }}
          >
            {authView === "login" ? (
              <LoginPage
                onRegister={() => {
                  clearError();
                  setAuthView("register");
                }}
                onSuccess={handleAuthSuccess}
                onCancel={handleAuthCancel}
              />
            ) : (
              <RegisterPage
                onLogin={() => {
                  clearError();
                  setAuthView("login");
                }}
                onSuccess={handleAuthSuccess}
                onCancel={handleAuthCancel}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default BrowserToolbar;
