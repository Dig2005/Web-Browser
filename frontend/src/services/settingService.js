import { apiRequest } from "./api";

export function fetchSettings() {
  return apiRequest("/settings");
}

export function updateSettings(settings) {
  return apiRequest("/settings", {
    method: "PUT",

    body: JSON.stringify(settings),
  });
}
