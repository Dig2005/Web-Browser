import { apiRequest } from "./api";

const TOKEN_KEY = "safora-auth-token";

const USER_KEY = "safora-user";

export function registerUser(name, email, password) {
  return apiRequest("/auth/register", {
    method: "POST",

    body: JSON.stringify({
      name,
      email,
      password,
    }),
  });
}

export function loginUser(email, password) {
  return apiRequest("/auth/login", {
    method: "POST",

    body: JSON.stringify({
      email,
      password,
    }),
  });
}

export function saveAuthData(data) {
  localStorage.setItem(TOKEN_KEY, data.token);

  localStorage.setItem(
    USER_KEY,
    JSON.stringify({
      id: data.userId,

      name: data.name,

      email: data.email,
    }),
  );
}

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser() {
  const stored = localStorage.getItem(USER_KEY);

  if (!stored) {
    return null;
  }

  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

export function clearAuthData() {
  localStorage.removeItem(TOKEN_KEY);

  localStorage.removeItem(USER_KEY);
}
