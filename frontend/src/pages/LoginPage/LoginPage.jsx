import { useState } from "react";

import { LogIn } from "lucide-react";

import { useAuth } from "../../context/AuthContext";

import styles from "./LoginPage.module.css";

function LoginPage({ onRegister, onSuccess, onCancel }) {
  const { login, loading, error, clearError } = useAuth();

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [localError, setLocalError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    clearError();
    setLocalError("");

    const cleanEmail = email.trim();

    if (!cleanEmail) {
      setLocalError("Enter your email.");

      return;
    }

    if (!password) {
      setLocalError("Enter your password.");

      return;
    }

    const result = await login(cleanEmail, password);

    if (result.success) {
      onSuccess?.();
    }
  };

  const displayedError = localError || error;

  return (
    <div className={styles.authPage}>
      <form className={styles.authCard} onSubmit={handleSubmit}>
        <div className={styles.logo}>S</div>

        <h1>Welcome to Safora</h1>

        <p className={styles.subtitle}>
          Sign in to access your Safora account.
        </p>

        <label className={styles.field}>
          <span>Email</span>

          <input
            type="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);

              clearError();
              setLocalError("");
            }}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
        </label>

        <label className={styles.field}>
          <span>Password</span>

          <input
            type="password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);

              clearError();
              setLocalError("");
            }}
            placeholder="Enter password"
            autoComplete="current-password"
            required
          />
        </label>

        {displayedError && (
          <p className={styles.error} role="alert">
            {displayedError}
          </p>
        )}

        <button
          type="submit"
          className={styles.primaryButton}
          disabled={loading}
        >
          <LogIn size={17} />

          {loading ? "Signing in..." : "Sign In"}
        </button>

        <div className={styles.switchAccount}>
          <span>New to Safora?</span>

          <button type="button" onClick={onRegister}>
            Create account
          </button>
        </div>

        {onCancel && (
          <button
            type="button"
            className={styles.cancelButton}
            onClick={onCancel}
          >
            Back to Safora
          </button>
        )}
      </form>
    </div>
  );
}

export default LoginPage;
