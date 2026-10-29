import { useState } from "react";

import { UserPlus } from "lucide-react";

import { useAuth } from "../../context/AuthContext";

import styles from "../LoginPage/LoginPage.module.css";

function RegisterPage({ onLogin, onSuccess, onCancel }) {
  const { register, loading, error, clearError } = useAuth();

  const [name, setName] = useState("");

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [confirmPassword, setConfirmPassword] = useState("");

  const [localError, setLocalError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    clearError();
    setLocalError("");

    const cleanName = name.trim();

    const cleanEmail = email.trim();

    if (!cleanName) {
      setLocalError("Enter your name.");

      return;
    }

    if (!cleanEmail) {
      setLocalError("Enter your email.");

      return;
    }

    if (!password) {
      setLocalError("Enter a password.");

      return;
    }

    if (password !== confirmPassword) {
      setLocalError("Passwords do not match.");

      return;
    }

    const result = await register(cleanName, cleanEmail, password);

    if (result.success) {
      onSuccess?.();
    }
  };

  const displayedError = localError || error;

  return (
    <div className={styles.authPage}>
      <form className={styles.authCard} onSubmit={handleSubmit}>
        <div className={styles.logo}>S</div>

        <h1>Create Safora Account</h1>

        <p className={styles.subtitle}>
          Create an account for your Safora data.
        </p>

        <label className={styles.field}>
          <span>Name</span>

          <input
            type="text"
            value={name}
            onChange={(event) => {
              setName(event.target.value);

              clearError();
              setLocalError("");
            }}
            placeholder="Your name"
            autoComplete="name"
            required
          />
        </label>

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
            placeholder="Create password"
            autoComplete="new-password"
            required
          />
        </label>

        <label className={styles.field}>
          <span>Confirm Password</span>

          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => {
              setConfirmPassword(event.target.value);

              clearError();
              setLocalError("");
            }}
            placeholder="Repeat password"
            autoComplete="new-password"
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
          <UserPlus size={17} />

          {loading ? "Creating..." : "Create Account"}
        </button>

        <div className={styles.switchAccount}>
          <span>Already have an account?</span>

          <button type="button" onClick={onLogin}>
            Sign in
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

export default RegisterPage;
