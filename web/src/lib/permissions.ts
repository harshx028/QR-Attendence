import { Capacitor, registerPlugin, type PermissionState } from "@capacitor/core";

/** Native helper — see android/.../AppPermissionsPlugin.java */
type PermAlias = "camera" | "location";
interface AppPermissionsPlugin {
  checkPermissions(): Promise<Record<PermAlias, PermissionState>>;
  requestPermissions(opts: { permissions: PermAlias[] }): Promise<Record<PermAlias, PermissionState>>;
  openSettings(): Promise<void>;
}

const AppPermissions = registerPlugin<AppPermissionsPlugin>("AppPermissions");
const isNative = Capacitor.isNativePlatform();

/**
 * granted     – OK to use
 * denied      – user said no, we can ask again
 * blocked     – denied permanently; only the system Settings page can change it
 * unavailable – no camera on this device / browser can't use it
 */
export type CameraAccess = "granted" | "denied" | "blocked" | "unavailable";

/** Check the camera permission and ask for it if needed. */
export async function ensureCamera(): Promise<CameraAccess> {
  if (isNative) {
    try {
      const { camera } = await AppPermissions.checkPermissions();
      if (camera === "granted") return "granted";
      if (camera === "denied") return "blocked"; // asked before, "don't ask again"
      const res = await AppPermissions.requestPermissions({ permissions: ["camera"] });
      if (res.camera === "granted") return "granted";
      // After a refusal Android may stop showing the dialog entirely.
      const after = await AppPermissions.checkPermissions();
      return after.camera === "denied" ? "blocked" : "denied";
    } catch {
      // Plugin missing (old build) — let the WebView try on its own.
      return "granted";
    }
  }

  // Browser: asking for the stream triggers the browser's own permission prompt.
  if (!navigator.mediaDevices?.getUserMedia) return "unavailable";
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
    stream.getTracks().forEach((t) => t.stop());
    return "granted";
  } catch (e: any) {
    if (e?.name === "NotFoundError" || e?.name === "OverconstrainedError") return "unavailable";
    return e?.name === "NotAllowedError" ? "blocked" : "denied";
  }
}

/** Ask for location permission on Android if it hasn't been decided yet. Never throws. */
export async function ensureLocation(): Promise<boolean> {
  if (!isNative) return true; // the browser asks by itself
  try {
    const { location } = await AppPermissions.checkPermissions();
    if (location === "granted") return true;
    if (location === "denied") return false;
    const res = await AppPermissions.requestPermissions({ permissions: ["location"] });
    return res.location === "granted";
  } catch {
    return true;
  }
}

/** Open this app's page in Android Settings (no-op on the web). */
export async function openAppSettings(): Promise<boolean> {
  if (!isNative) return false;
  try {
    await AppPermissions.openSettings();
    return true;
  } catch {
    return false;
  }
}

/** Current location for check-in/out, or nulls if unavailable/denied. */
export async function getLocation(): Promise<{ lat: number | null; lng: number | null }> {
  await ensureLocation();
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve({ lat: null, lng: null });
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve({ lat: null, lng: null }),
      { timeout: 8000, enableHighAccuracy: true }
    );
  });
}
