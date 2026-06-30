import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { getRouter } from "./router";
import { trackPageView } from "./lib/analytics";
import { pixelPageView } from "./lib/meta-pixel";
import "./styles.css";

const router = getRouter();

// Track every route change as a page view (fires on initial load too).
router.subscribe("onResolved", () => {
  const path = router.state.location.pathname;
  trackPageView(path);   // GA4
  pixelPageView();       // Meta Pixel
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
