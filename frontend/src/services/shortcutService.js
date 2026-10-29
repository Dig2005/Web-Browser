import { apiRequest } from "./api";

export function fetchShortcuts() {
  return apiRequest("/shortcuts");
}

export function createShortcut(shortcut) {
  return apiRequest("/shortcuts", {
    method: "POST",
    body: JSON.stringify({
      name: shortcut.name,
      url: shortcut.url,
    }),
  });
}

export function updateShortcut(shortcutId, shortcut) {
  return apiRequest(`/shortcuts/${shortcutId}`, {
    method: "PUT",

    body: JSON.stringify({
      name: shortcut.name,

      url: shortcut.url,
    }),
  });
}

export function deleteShortcut(shortcutId) {
  return apiRequest(`/shortcuts/${shortcutId}`, {
    method: "DELETE",
  });
}
