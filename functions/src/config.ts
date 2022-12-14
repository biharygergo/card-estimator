import * as functions from "firebase-functions";

export const appConfig = {
  zoomClientId: process.env.ZOOM_CLIENT_ID || "",
  zoomClientIdDev: process.env.ZOOM_CLIENT_ID_DEV || "",
  zoomClientSecret: process.env.ZOOM_CLIENT_SECRET || "",
  zoomClientSecretDev: process.env.ZOOM_CLIENT_SECRET_DEV || "",
  zoomAppName: process.env.ZOOM_APP_NAME || "",
  zoomRedirectUrl: process.env.ZOOM_REDIRECT_URL || "",
};

export function getHost(req: functions.Request) {
  const host = req.headers["x-forwarded-host"] as string;
  const protocol = host.startsWith("localhost") ? "http://" : "https://";
  return `${protocol}${host}` ?? "https://planningpoker.live";
}

export function isRunningInDevMode(req: functions.Request) {
  const host = req.headers["x-forwarded-host"] as string;
  const isDev =
    process.env.FUNCTIONS_EMULATOR === "true" ||
    host.includes("localhost") ||
    host.includes("staging.planningpoker.live") ||
    host.includes("ngrok");
  return isDev;
}
