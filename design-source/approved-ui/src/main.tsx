import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { CssVarsProvider } from "@mui/joy/styles";
import CssBaseline from "@mui/joy/CssBaseline";
import { joyTheme } from "./theme/joyTheme";
import { queryClient } from "./hooks/useHousehold";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LocalizationProvider } from "./contexts/LocalizationContext";
import App from "./App";
import "./i18n";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <CssVarsProvider theme={joyTheme} defaultMode="light" modeStorageKey="dydan-joy-mode" disableNestedContext>
        <CssBaseline />
        <ThemeProvider>
          <LocalizationProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </LocalizationProvider>
        </ThemeProvider>
      </CssVarsProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);
