import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { apiRequest } from "../services/api";

const BackendStatusContext = createContext(null);

export function BackendStatusProvider({ children }) {
  const [status, setStatus] = useState("unknown");

  const [checking, setChecking] = useState(false);

  const checkBackend = useCallback(async () => {
    setChecking(true);

    try {
      await apiRequest("/health");

      setStatus("online");

      return true;
    } catch {
      setStatus("offline");

      return false;
    } finally {
      setChecking(false);
    }
  }, []);
  useEffect(() => {
    checkBackend();
  }, [checkBackend]);

  const value = useMemo(
    () => ({
      status,

      isOnline: status === "online",

      isOffline: status === "offline",

      checking,

      checkBackend,
    }),
    [status, checking, checkBackend],
  );

  return (
    <BackendStatusContext.Provider value={value}>
      {children}
    </BackendStatusContext.Provider>
  );
}

export function useBackendStatus() {
  const context = useContext(BackendStatusContext);

  if (!context) {
    throw new Error(
      "useBackendStatus must be used inside BackendStatusProvider",
    );
  }

  return context;
}
