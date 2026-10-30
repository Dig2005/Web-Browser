const API_URL = "http://localhost:8080/api";

const REQUEST_TIMEOUT = 10000;

function createApiError(message, status = 0, data = null) {
  const error = new Error(message);

  error.status = status;

  error.data = data;

  return error;
}

async function readResponseData(response) {
  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get("content-type");

  if (contentType?.includes("application/json")) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  try {
    const text = await response.text();

    return text || null;
  } catch {
    return null;
  }
}

export async function apiRequest(path, options = {}) {
  const controller = new AbortController();

  const timeoutId = window.setTimeout(() => {
    controller.abort();
  }, REQUEST_TIMEOUT);

  const token = localStorage.getItem("safora-auth-token");

  const headers = {
    ...(options.body
      ? {
          "Content-Type": "application/json",
        }
      : {}),

    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...options,

      headers,

      signal: controller.signal,
    });

    const data = await readResponseData(response);

    if (response.status === 401) {
      const isAuthRequest = path.startsWith("/auth/");

      if (!isAuthRequest) {
        window.dispatchEvent(new CustomEvent("safora:auth-expired"));
      }

      throw createApiError(
        isAuthRequest
          ? "Invalid email or password."
          : "Your session has expired. Sign in again.",
        401,
        data,
      );
    }

    if (response.status === 403) {
      throw createApiError(
        "You do not have permission to perform this action.",
        403,
        data,
      );
    }

    if (!response.ok) {
      let message = `Request failed with status ${response.status}.`;

      if (data && typeof data === "object") {
        message = data.message || data.error || message;
      }

      if (typeof data === "string" && data.trim()) {
        message = data.trim();
      }

      throw createApiError(message, response.status, data);
    }

    return data;
  } catch (error) {
    if (error?.name === "AbortError") {
      throw createApiError("The server took too long to respond.", 408);
    }

    if (typeof error?.status === "number" && error.status > 0) {
      throw error;
    }

    throw createApiError(
      "Cannot connect to the Safora backend. Check that Spring Boot is running.",
      0,
    );
  } finally {
    window.clearTimeout(timeoutId);
  }
}
