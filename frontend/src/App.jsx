import { AuthProvider } from "./context/AuthContext";

import { BookmarkProvider } from "./context/BookmarkContext";

import { BrowserProvider } from "./context/BrowserContext";

import { DownloadProvider } from "./context/DownloadContext";

import { HistoryProvider } from "./context/HistoryContext";

import BrowserLayout from "./layouts/BrowserLayout/BrowserLayout";

function App() {
  return (
    <AuthProvider>
      <BrowserProvider>
        <BookmarkProvider>
          <HistoryProvider>
            <DownloadProvider>
              <BrowserLayout />
            </DownloadProvider>
          </HistoryProvider>
        </BookmarkProvider>
      </BrowserProvider>
    </AuthProvider>
  );
}

export default App;
