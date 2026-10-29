import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import {
  clearAuthData,
  getStoredToken,
  getStoredUser,
  loginUser,
  registerUser,
  saveAuthData,
} from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredUser());

  const [token, setToken] = useState(() => getStoredToken());

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const isAuthenticated = Boolean(user && token);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError("");

    try {
      const data = await loginUser(email, password);

      saveAuthData(data);

      const loggedInUser = {
        id: data.userId,

        name: data.name,

        email: data.email,
      };

      setToken(data.token);

      setUser(loggedInUser);

      return {
        success: true,
        user: loggedInUser,
      };
    } catch (requestError) {
      const message = requestError?.message || "Unable to sign in.";

      setError(message);

      return {
        success: false,
        message,
      };
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (name, email, password) => {
    setLoading(true);
    setError("");

    try {
      const data = await registerUser(name, email, password);

      saveAuthData(data);

      const registeredUser = {
        id: data.userId,

        name: data.name,

        email: data.email,
      };

      setToken(data.token);

      setUser(registeredUser);

      return {
        success: true,
        user: registeredUser,
      };
    } catch (requestError) {
      const message = requestError?.message || "Unable to create account.";

      setError(message);

      return {
        success: false,
        message,
      };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    clearAuthData();

    setToken(null);
    setUser(null);
    setError("");
  }, []);

  const clearError = useCallback(() => {
    setError("");
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,

      isAuthenticated,

      loading,
      error,

      login,
      register,
      logout,

      clearError,
    }),
    [
      user,
      token,

      isAuthenticated,

      loading,
      error,

      login,
      register,
      logout,

      clearError,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
