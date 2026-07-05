(function (root) {
  const config = {
    API_ENDPOINT: "http://localhost:8000/api/analyze",
    ADMIN_CONSOLE_BASE: "http://localhost:3000/dashboard",

    buildAdminConsoleUrl(captureId) {
      const url = new URL(config.ADMIN_CONSOLE_BASE);
      url.searchParams.set("capture_id", captureId);
      return url.toString();
    },

    createCaptureId() {
      return `cap_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    }
  };

  root.AgenticQAConfig = config;
})(typeof globalThis !== "undefined" ? globalThis : window);
