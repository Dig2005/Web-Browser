import { AuthProvider } from "./context/AuthContext";

import { BackendStatusProvider } from "./context/BackendStatusContext";

import { BookmarkProvider } from "./context/BookmarkContext";

import { BrowserProvider } from "./context/BrowserContext";

import { DownloadProvider } from "./context/DownloadContext";

import { HistoryProvider } from "./context/HistoryContext";

import BrowserLayout from "./layouts/BrowserLayout/BrowserLayout";

function App() {
  return (
    <BackendStatusProvider>
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
    </BackendStatusProvider>
  );
}

export default App;
