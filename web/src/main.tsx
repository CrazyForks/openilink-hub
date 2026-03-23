import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import { LoginPage } from "./pages/login";
import { Layout } from "./components/layout";
import { BotsPage } from "./pages/bots";
import { BotDetailPage } from "./pages/bot-detail";
import { SettingsPage } from "./pages/settings";
import { PluginsPage } from "./pages/plugins";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<Layout />}>
          <Route path="/" element={<BotsPage />} />
          <Route path="/bot/:id" element={<BotDetailPage />} />
          <Route path="/plugins" element={<PluginsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
