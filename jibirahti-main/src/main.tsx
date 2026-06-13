import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { getRouter } from "./router";
import { trackPageView } from "./lib/analytics";
import "./styles.css";

const router = getRouter();

// Track every route change as a page view (fires on initial load too).
router.subscribe("onResolved", () => {
  trackPageView(router.state.location.pathname);
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
