import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { NotificationProvider } from "./context/NotificationContext.jsx";
import { DmProvider } from "./context/DmContext.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { GameSocketProvider } from "./context/GameSocketContext.jsx";
import { PwaInstallProvider } from "./context/PwaInstallContext.jsx";
import { registerServiceWorker } from "./lib/pwa.js";
import "./index.css";

registerServiceWorker();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <NotificationProvider>
            <DmProvider>
              <GameSocketProvider>
                <PwaInstallProvider>
                  <App />
                </PwaInstallProvider>
              </GameSocketProvider>
            </DmProvider>
          </NotificationProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>,
);

// Lets the opening screen in index.html know the app is up, so it can
// fade out rather than being timed blindly.
window.__appReady?.();
