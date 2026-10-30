import {
  Bookmark,
  Download,
  Home,
  History,
  Settings,
  SlidersHorizontal,
} from "lucide-react";

function Sidebar({ styles, activeItem, onItemChange }) {
  const navigationItems = [
    {
      id: "home",
      label: "Home",
      icon: Home,
    },

    {
      id: "settings",
      label: "Settings",
      icon: Settings,
    },

    {
      id: "bookmarks",
      label: "Bookmarks",
      icon: Bookmark,
    },

    {
      id: "history",
      label: "History",
      icon: History,
    },

    {
      id: "downloads",
      label: "Downloads",
      icon: Download,
    },
  ];

  return (
    <aside className={styles.sidebar}>
      <nav className={styles.sidebarNavigation}>
        {navigationItems.map((item) => {
          const Icon = item.icon;

          const active = activeItem === item.id;

          return (
            <button
              key={item.id}
              type="button"
              className={`${styles.sidebarItem} ${
                active ? styles.activeSidebarItem : ""
              }`}
              onClick={() => onItemChange(item.id)}
            >
              <span className={styles.sidebarIcon}>
                <Icon size={17} />
              </span>

              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <button
        type="button"
        className={styles.customizeButton}
        onClick={() => onItemChange("settings")}
      >
        <span className={styles.customizeIcon}>
          <SlidersHorizontal size={18} />
        </span>

        <span>
          <strong>Customize</strong>

          <small>Your browser</small>
        </span>
      </button>
    </aside>
  );
}

export default Sidebar;
