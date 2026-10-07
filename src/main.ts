import { Application } from "./Application";

/**
 * Entry point for the CHIP-8 web application.
 */
window.addEventListener("DOMContentLoaded", () => {
  const app = new Application();
  app.init();
});
