import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CssVarsProvider } from "@mui/joy/styles";
import CssBaseline from "@mui/joy/CssBaseline";
import { AlertsProvider } from "./service/AlertsProvider";
import { NotificationProvider } from "./service/NotificationProvider";
import { LocalizationProvider } from "./contexts/LocalizationContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LiveDataProvider } from "./model/liveData";
import { joyTheme } from "./theme/joyTheme";
import App from "./App";
import "./i18n";
import "./index.css";
import "@fontsource-variable/comfortaa";
import "@fontsource/cairo/400.css";
import "@fontsource/cairo/600.css";
import "@fontsource/cairo/700.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/600.css";

/* Real query client with production defaults */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <CssVarsProvider theme={joyTheme} defaultMode="light" modeStorageKey="dydan-joy-mode" disableNestedContext>
        <CssBaseline />
        <ThemeProvider>
          <LocalizationProvider>
            <AlertsProvider>
              <NotificationProvider>
                <LiveDataProvider>
                  <BrowserRouter>
                    <App />
                  </BrowserRouter>
                </LiveDataProvider>
              </NotificationProvider>
            </AlertsProvider>
          </LocalizationProvider>
        </ThemeProvider>
      </CssVarsProvider>
    </QueryClientProvider>
  </React.StrictMode>
);