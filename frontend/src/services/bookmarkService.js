import { apiRequest } from "./api";

export function fetchBookmarks() {
  return apiRequest("/bookmarks");
}
export function createBookmark(bookmark) {
  return apiRequest("/bookmarks", {
    method: "POST",
    body: JSON.stringify({
      title: bookmark.title,
      url: bookmark.url,
      favicon: bookmark.favicon || null,
    }),
  });
}
export function deleteBookmark(bookmarkId) {
  return apiRequest(`/bookmarks/${bookmarkId}`, {
    method: "DELETE",
  });
}
