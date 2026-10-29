import {
  ArrowLeft,
  ChevronRight,
  Download,
  LogIn,
  LogOut,
  Monitor,
  PanelTop,
  Rocket,
  Search,
  Settings,
  UserCircle,
  UserPlus,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import LoginPage from "../LoginPage/LoginPage";
import RegisterPage from "../RegisterPage/RegisterPage";
import { useBrowser } from "../../context/BrowserContext";
import styles from "./SettingsPage.module.css";
function SettingsPage({ onBackHome }) {
  const {
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
    setAskDownloadLocation,
    chooseDownloadFolder,
    switchToNewTab,
    setSwitchToNewTab,
  } = useBrowser();
  const { user, isAuthenticated, logout } = useAuth();
  const [activeSection, setActiveSection] = useState(null);
  const [authView, setAuthView] = useState(null);
  const sections = [
    {
      id: "account",
      icon: UserCircle,
      title: "Account",
      description:
        "Sign in to access your Safora account and synchronized browser data.",
    },
    {
      id: "search",
      icon: Search,
      title: "Search",
      description: "Choose your default search engine and search preferences.",
    },
    {
      id: "appearance",
      icon: Monitor,
      title: "Appearance",
      description: "Customize Safora's theme and visual preferences.",
    },
    {
      id: "startup",
      icon: Rocket,
      title: "On Startup",
      description: "Choose what Safora should open when the browser starts.",
    },
    {
      id: "downloads",
      icon: Download,
      title: "Downloads",
      description: "Manage download preferences and download behavior.",
    },
    {
      id: "tabs",
      icon: PanelTop,
      title: "Tabs",
      description: "Control how new tabs and browser tabs behave.",
    },
  ];
  const searchEngines = [
    {
      id: "google",
      label: "Google",
      letter: "G",
    },
    {
      id: "bing",
      label: "Bing",
      letter: "B",
    },
    {
      id: "duckduckgo",
      label: "DuckDuckGo",
      letter: "D",
    },
  ];
  const getSearchEngineLabel = () => {
    switch (searchEngine) {
      case "google":
        return "Google";
      case "duckduckgo":
        return "DuckDuckGo";
      default:
        return "Bing";
    }
  };
  const handleSectionClick = (sectionId) => {
    const availableSections = [
      "account",
      "search",
      "appearance",
      "startup",
      "downloads",
      "tabs",
    ];

    if (availableSections.includes(sectionId)) {
      setActiveSection(sectionId);

      setAuthView(null);
    }
  };
  const themeOptions = [
    {
      id: "dark",
      label: "Dark",
      description: "Use Safora's dark appearance.",
    },
    {
      id: "light",
      label: "Light",
      description: "Use a bright appearance.",
    },
    {
      id: "system",
      label: "System",
      description: "Follow your device appearance.",
    },
  ];
  const getThemeLabel = () => {
    switch (theme) {
      case "light":
        return "Light";
      case "system":
        return "System";
      default:
        return "Dark";
    }
  };
  return (
    <section className={styles.settingsPage}>
      <header className={styles.settingsHeader}>
        <div className={styles.headingArea}>
          <button
            type="button"
            className={styles.backButton}
            onClick={onBackHome}
            title="Back to Safora Home"
            aria-label="Back to Safora Home"
          >
            <ArrowLeft size={19} />
          </button>

          <div>
            <div className={styles.titleRow}>
              <Settings size={22} />

              <h1>Settings</h1>
            </div>

            <p>Customize how Safora looks and behaves.</p>
          </div>
        </div>
      </header>

      <div className={styles.settingsIntro}>
        <div className={styles.introIcon}>
          <Settings size={26} />
        </div>

        <div>
          <h2>Browser preferences</h2>

          <p>
            Settings apply across Safora while the Settings page itself remains
            part of the current tab.
          </p>
        </div>
      </div>
      {activeSection === "account" && !authView && (
        <section className={styles.settingPanel}>
          <div className={styles.settingPanelHeader}>
            <div>
              <h2>Safora Account</h2>

              <p>Manage your Safora account and synchronized browser data.</p>
            </div>

            <button
              type="button"
              className={styles.panelCloseButton}
              onClick={() => setActiveSection(null)}
            >
              Done
            </button>
          </div>

          {isAuthenticated ? (
            <div className={styles.accountSignedIn}>
              <div className={styles.accountAvatar}>
                <UserCircle size={30} />
              </div>

              <div className={styles.accountInformation}>
                <strong>{user?.name || "Safora User"}</strong>

                <span>{user?.email || ""}</span>
              </div>

              <span className={styles.signedInBadge}>Signed in</span>

              <button
                type="button"
                className={styles.signOutButton}
                onClick={logout}
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          ) : (
            <div className={styles.accountSignedOut}>
              <div className={styles.accountMessage}>
                <div className={styles.accountAvatar}>
                  <UserCircle size={30} />
                </div>

                <div>
                  <strong>You're not signed in</strong>

                  <p>
                    Sign in or create an account to use your Safora account.
                  </p>
                </div>
              </div>

              <div className={styles.accountActions}>
                <button
                  type="button"
                  className={styles.accountPrimaryButton}
                  onClick={() => setAuthView("login")}
                >
                  <LogIn size={16} />
                  Sign In
                </button>

                <button
                  type="button"
                  className={styles.accountSecondaryButton}
                  onClick={() => setAuthView("register")}
                >
                  <UserPlus size={16} />
                  Create Account
                </button>
              </div>
            </div>
          )}
        </section>
      )}
      {activeSection === "account" && authView === "login" && (
        <LoginPage
          onRegister={() => setAuthView("register")}
          onSuccess={() => setAuthView(null)}
          onCancel={() => setAuthView(null)}
        />
      )}
      {activeSection === "account" && authView === "register" && (
        <RegisterPage
          onLogin={() => setAuthView("login")}
          onSuccess={() => setAuthView(null)}
          onCancel={() => setAuthView(null)}
        />
      )}
      {activeSection === "search" && (
        <section className={styles.settingPanel}>
          <div className={styles.settingPanelHeader}>
            <div>
              <h2>Default search engine</h2>

              <p>
                Choose which search engine Safora uses when text entered in the
                address bar is not a website address.
              </p>
            </div>

            <button
              type="button"
              className={styles.panelCloseButton}
              onClick={() => setActiveSection(null)}
            >
              Done
            </button>
          </div>

          <div className={styles.searchEngineOptions}>
            {searchEngines.map((engine) => {
              const selected = searchEngine === engine.id;

              return (
                <button
                  key={engine.id}
                  type="button"
                  className={`${styles.searchEngineOption} ${
                    selected ? styles.selectedEngine : ""
                  }`}
                  onClick={() => setSearchEngine(engine.id)}
                >
                  <span className={styles.engineIcon}>{engine.letter}</span>

                  <span className={styles.engineName}>{engine.label}</span>

                  <span className={styles.engineRadio}>
                    {selected && <span />}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}
      {activeSection === "appearance" && (
        <section className={styles.settingPanel}>
          <div className={styles.settingPanelHeader}>
            <div>
              <h2>Appearance</h2>

              <p>Choose how the Safora interface should appear.</p>
            </div>

            <button
              type="button"
              className={styles.panelCloseButton}
              onClick={() => setActiveSection(null)}
            >
              Done
            </button>
          </div>

          <div className={styles.themeOptions}>
            {themeOptions.map((option) => {
              const selected = theme === option.id;

              return (
                <button
                  key={option.id}
                  type="button"
                  className={`${styles.themeOption} ${
                    selected ? styles.selectedTheme : ""
                  }`}
                  onClick={() => setTheme(option.id)}
                >
                  <span
                    className={`${styles.themePreview} ${
                      styles[`${option.id}Preview`]
                    }`}
                  >
                    <span className={styles.previewToolbar} />

                    <span className={styles.previewSidebar} />

                    <span className={styles.previewContent} />
                  </span>

                  <span className={styles.themeText}>
                    <strong>{option.label}</strong>

                    <small>{option.description}</small>
                  </span>

                  <span className={styles.engineRadio}>
                    {selected && <span />}
                  </span>
                </button>
              );
            })}
          </div>

          {theme === "system" && (
            <p className={styles.systemThemeStatus}>
              Current system appearance:{" "}
              {resolvedTheme === "dark" ? "Dark" : "Light"}
            </p>
          )}
        </section>
      )}
      {activeSection === "startup" && (
        <section className={styles.settingPanel}>
          <div className={styles.settingPanelHeader}>
            <div>
              <h2>On Startup</h2>

              <p>Choose what Safora should open when the browser starts.</p>
            </div>

            <button
              type="button"
              className={styles.panelCloseButton}
              onClick={() => setActiveSection(null)}
            >
              Done
            </button>
          </div>

          <div className={styles.optionList}>
            <button
              type="button"
              className={`${styles.optionRow} ${
                startupMode === "home" ? styles.selectedOption : ""
              }`}
              onClick={() => setStartupMode("home")}
            >
              <span>
                <strong>Open Safora Home</strong>

                <small>Start with a fresh Safora Home tab.</small>
              </span>

              <span className={styles.engineRadio}>
                {startupMode === "home" && <span />}
              </span>
            </button>

            <button
              type="button"
              className={`${styles.optionRow} ${
                startupMode === "continue" ? styles.selectedOption : ""
              }`}
              onClick={() => setStartupMode("continue")}
            >
              <span>
                <strong>Continue where you left off</strong>

                <small>Restore the previous browsing session.</small>
              </span>

              <span className={styles.engineRadio}>
                {startupMode === "continue" && <span />}
              </span>
            </button>

            <button
              type="button"
              className={`${styles.optionRow} ${
                startupMode === "custom" ? styles.selectedOption : ""
              }`}
              onClick={() => setStartupMode("custom")}
            >
              <span>
                <strong>Open a specific page</strong>

                <small>Start Safora on a website you choose.</small>
              </span>

              <span className={styles.engineRadio}>
                {startupMode === "custom" && <span />}
              </span>
            </button>
          </div>

          {startupMode === "custom" && (
            <label className={styles.textSetting}>
              <span>Startup URL</span>

              <input
                type="text"
                value={startupUrl}
                onChange={(event) => setStartupUrl(event.target.value)}
                placeholder="https://www.google.com"
              />
            </label>
          )}
        </section>
      )}
      {activeSection === "downloads" && (
        <section className={styles.settingPanel}>
          <div className={styles.settingPanelHeader}>
            <div>
              <h2>Downloads</h2>

              <p>Choose how Safora handles downloaded files.</p>
            </div>

            <button
              type="button"
              className={styles.panelCloseButton}
              onClick={() => setActiveSection(null)}
            >
              Done
            </button>
          </div>

          <div className={styles.downloadLocation}>
            <div>
              <strong>Download location</strong>

              <small>{downloadPath || "System Downloads folder"}</small>
            </div>

            <button
              type="button"
              className={styles.changeFolderButton}
              onClick={chooseDownloadFolder}
            >
              Change
            </button>
          </div>

          <label className={styles.toggleRow}>
            <span>
              <strong>Ask where to save each file</strong>

              <small>Choose a location for every new download.</small>
            </span>

            <input
              type="checkbox"
              checked={askDownloadLocation}
              onChange={(event) => setAskDownloadLocation(event.target.checked)}
            />
          </label>
        </section>
      )}
      {activeSection === "tabs" && (
        <section className={styles.settingPanel}>
          <div className={styles.settingPanelHeader}>
            <div>
              <h2>Tabs</h2>

              <p>Customize Safora tab behavior.</p>
            </div>

            <button
              type="button"
              className={styles.panelCloseButton}
              onClick={() => setActiveSection(null)}
            >
              Done
            </button>
          </div>

          <label className={styles.toggleRow}>
            <span>
              <strong>Switch to newly opened tabs</strong>

              <small>Make a new Safora tab active immediately.</small>
            </span>

            <input
              type="checkbox"
              checked={switchToNewTab}
              onChange={(event) => setSwitchToNewTab(event.target.checked)}
            />
          </label>

          <div className={styles.simpleSetting}>
            <span>
              <strong>New tab page</strong>

              <small>New tabs open on Safora Home.</small>
            </span>

            <span className={styles.valueBadge}>Safora Home</span>
          </div>
        </section>
      )}
      <div className={styles.settingsList}>
        {sections.map((section) => {
          const Icon = section.icon;
          let status = section.status;
          if (section.id === "account") {
            status = isAuthenticated
              ? user?.name || "Signed in"
              : "Not signed in";
          }
          if (section.id === "search") {
            status = getSearchEngineLabel();
          }
          if (section.id === "appearance") {
            status = getThemeLabel();
          }
          return (
            <button
              key={section.id}
              type="button"
              className={styles.settingsCard}
              onClick={() => handleSectionClick(section.id)}
            >
              <span className={styles.settingIcon}>
                <Icon size={21} />
              </span>

              <span className={styles.settingContent}>
                <strong>{section.title}</strong>

                <small>{section.description}</small>
              </span>

              <span className={styles.settingStatus}>{status}</span>

              <ChevronRight className={styles.chevron} size={18} />
            </button>
          );
        })}
      </div>

      <footer className={styles.settingsFooter}>
        <span>Safora Browser</span>

        <span>Settings</span>
      </footer>
    </section>
  );
}

export default SettingsPage;
