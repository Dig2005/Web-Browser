import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { STORAGE_KEYS } from "../constants/storageKeys";

import { getStoredData, saveStoredData } from "../utils/storage";

import { useAuth } from "./AuthContext";

import {
  createBookmark,
  deleteBookmark,
  fetchBookmarks,
} from "../services/bookmarkService";

const BookmarkContext = createContext(null);

function generateBookmarkId() {
  return `bookmark-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getLocalBookmarks() {
  const stored = getStoredData(STORAGE_KEYS.bookmarks, []);

  return Array.isArray(stored) ? stored : [];
}

export function BookmarkProvider({ children }) {
  const { isAuthenticated, user } = useAuth();

  const [bookmarks, setBookmarks] = useState(getLocalBookmarks);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const loadBookmarks = useCallback(async () => {
    if (!isAuthenticated) {
      setBookmarks(getLocalBookmarks());

      setLoading(false);
      setError("");

      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await fetchBookmarks();

      setBookmarks(Array.isArray(result) ? result : []);
    } catch (requestError) {
      setError(requestError?.message || "Unable to load bookmarks.");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadBookmarks();
  }, [loadBookmarks, user?.id]);

  const persistBookmarks = useCallback(
    (nextBookmarks) => {
      if (isAuthenticated) {
        setBookmarks(Array.isArray(nextBookmarks) ? nextBookmarks : []);

        return;
      }

      const next = Array.isArray(nextBookmarks) ? nextBookmarks : [];

      setBookmarks(next);

      saveStoredData(STORAGE_KEYS.bookmarks, next);
    },
    [isAuthenticated],
  );

  const addBookmark = useCallback(
    async ({ title, url, favicon }) => {
      if (!url || url === "browser://new-tab") {
        return null;
      }

      const alreadyExists = bookmarks.some((bookmark) => bookmark.url === url);

      if (alreadyExists) {
        return null;
      }

      if (isAuthenticated) {
        try {
          setError("");

          const savedBookmark = await createBookmark({
            title: title || url,

            url,

            favicon: favicon || null,
          });

          setBookmarks((current) => [savedBookmark, ...current]);

          return savedBookmark;
        } catch (requestError) {
          setError(requestError?.message || "Unable to save bookmark.");

          return null;
        }
      }

      const bookmark = {
        id: generateBookmarkId(),

        title: title || url,

        url,

        favicon: favicon || null,

        createdAt: new Date().toISOString(),
      };

      setBookmarks((current) => {
        const next = [bookmark, ...current];

        saveStoredData(STORAGE_KEYS.bookmarks, next);

        return next;
      });

      return bookmark;
    },
    [bookmarks, isAuthenticated],
  );

  const removeBookmark = useCallback(
    async (bookmarkId) => {
      if (bookmarkId === null || bookmarkId === undefined) {
        return;
      }

      if (isAuthenticated) {
        try {
          setError("");

          await deleteBookmark(bookmarkId);

          setBookmarks((current) =>
            current.filter((bookmark) => bookmark.id !== bookmarkId),
          );
        } catch (requestError) {
          setError(requestError?.message || "Unable to delete bookmark.");
        }

        return;
      }

      setBookmarks((current) => {
        const next = current.filter((bookmark) => bookmark.id !== bookmarkId);

        saveStoredData(STORAGE_KEYS.bookmarks, next);

        return next;
      });
    },
    [isAuthenticated],
  );

  const removeBookmarkByUrl = useCallback(
    async (url) => {
      if (!url) {
        return;
      }

      const bookmark = bookmarks.find((item) => item.url === url);

      if (!bookmark) {
        return;
      }

      if (isAuthenticated) {
        try {
          setError("");

          await deleteBookmark(bookmark.id);

          setBookmarks((current) => current.filter((item) => item.url !== url));
        } catch (requestError) {
          setError(requestError?.message || "Unable to delete bookmark.");
        }

        return;
      }

      setBookmarks((current) => {
        const next = current.filter((item) => item.url !== url);

        saveStoredData(STORAGE_KEYS.bookmarks, next);

        return next;
      });
    },
    [bookmarks, isAuthenticated],
  );

  const isBookmarked = useCallback(
    (url) => {
      return bookmarks.some((bookmark) => bookmark.url === url);
    },
    [bookmarks],
  );

  const getBookmarkByUrl = useCallback(
    (url) => {
      return bookmarks.find((bookmark) => bookmark.url === url) ?? null;
    },
    [bookmarks],
  );

  const clearError = useCallback(() => {
    setError("");
  }, []);

  const value = useMemo(
    () => ({
      bookmarks,

      loading,
      error,

      addBookmark,

      removeBookmark,

      removeBookmarkByUrl,

      isBookmarked,

      getBookmarkByUrl,

      persistBookmarks,

      refreshBookmarks: loadBookmarks,

      clearError,
    }),
    [
      bookmarks,

      loading,
      error,

      addBookmark,

      removeBookmark,

      removeBookmarkByUrl,

      isBookmarked,

      getBookmarkByUrl,

      persistBookmarks,

      loadBookmarks,

      clearError,
    ],
  );

  return (
    <BookmarkContext.Provider value={value}>
      {children}
    </BookmarkContext.Provider>
  );
}

export function useBookmarks() {
  const context = useContext(BookmarkContext);

  if (!context) {
    throw new Error("useBookmarks must be used inside BookmarkProvider");
  }

  return context;
}
