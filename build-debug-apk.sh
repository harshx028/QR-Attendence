#!/usr/bin/env bash
# Build a debug APK of the Capacitor app in ./web.
#
# Usage:  ./build-debug-apk.sh [--skip-install] [--install]
#   --skip-install   don't run `npm ci` / `npm install` first
#   --install        after building, install the APK on a connected device via adb
#
# Output: ./build/mark-attendance-debug.apk
#
# Requirements: Node.js + npm, JDK 17 or 21, Android SDK (platform 35 + build-tools).
# JAVA_HOME / ANDROID_HOME are auto-detected from common locations if not set.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEB_DIR="$ROOT_DIR/web"
ANDROID_DIR="$WEB_DIR/android"
OUT_DIR="$ROOT_DIR/build"
OUT_APK="$OUT_DIR/mark-attendance-debug.apk"

SKIP_INSTALL=0
ADB_INSTALL=0
for arg in "$@"; do
  case "$arg" in
    --skip-install) SKIP_INSTALL=1 ;;
    --install) ADB_INSTALL=1 ;;
    -h|--help) sed -n '2,12p' "$0"; exit 0 ;;
    *) echo "Unknown option: $arg" >&2; exit 1 ;;
  esac
done

info()  { printf '\033[1;34m==>\033[0m %s\n' "$*"; }
ok()    { printf '\033[1;32m✔\033[0m %s\n' "$*"; }
fail()  { printf '\033[1;31m✘ %s\033[0m\n' "$*" >&2; exit 1; }

# ---------- Node ----------
command -v node >/dev/null || fail "Node.js not found. Install Node 18+."
command -v npm  >/dev/null || fail "npm not found."

# ---------- Java ----------
if [[ -z "${JAVA_HOME:-}" ]]; then
  for c in \
    /opt/android-studio/jbr \
    "$HOME/android-studio/jbr" \
    /usr/lib/jvm/java-21-openjdk \
    /usr/lib/jvm/java-17-openjdk \
    /usr/lib/jvm/default \
    /Applications/Android\ Studio.app/Contents/jbr/Contents/Home; do
    if [[ -x "$c/bin/java" ]]; then export JAVA_HOME="$c"; break; fi
  done
fi
if [[ -n "${JAVA_HOME:-}" ]]; then
  export PATH="$JAVA_HOME/bin:$PATH"
fi
command -v java >/dev/null || fail "Java not found. Install JDK 17/21 (e.g. 'sudo pacman -S jdk21-openjdk') or set JAVA_HOME."

# ---------- Android SDK ----------
if [[ -z "${ANDROID_HOME:-}" ]]; then
  ANDROID_HOME="${ANDROID_SDK_ROOT:-}"
fi
if [[ -z "${ANDROID_HOME:-}" ]]; then
  for c in "$HOME/Android/Sdk" "$HOME/Library/Android/sdk" /opt/android-sdk; do
    if [[ -d "$c" ]]; then ANDROID_HOME="$c"; break; fi
  done
fi
[[ -n "${ANDROID_HOME:-}" && -d "$ANDROID_HOME" ]] \
  || fail "Android SDK not found. Install it (Android Studio, or 'android-sdk' packages) or set ANDROID_HOME."
export ANDROID_HOME ANDROID_SDK_ROOT="$ANDROID_HOME"
# Gradle reads the SDK location from local.properties (git-ignored).
echo "sdk.dir=$ANDROID_HOME" > "$ANDROID_DIR/local.properties"

info "Java:        $(java -version 2>&1 | head -1)"
info "Android SDK: $ANDROID_HOME"

# ---------- Web build ----------
cd "$WEB_DIR"
if [[ $SKIP_INSTALL -eq 0 ]]; then
  info "Installing npm dependencies…"
  if [[ -f package-lock.json ]]; then npm ci; else npm install; fi
fi

info "Building web app…"
npm run build

info "Syncing Capacitor Android project…"
npx cap sync android

# ---------- Gradle ----------
info "Building debug APK with Gradle…"
cd "$ANDROID_DIR"
chmod +x ./gradlew
./gradlew assembleDebug --no-daemon

SRC_APK="$ANDROID_DIR/app/build/outputs/apk/debug/app-debug.apk"
[[ -f "$SRC_APK" ]] || fail "Build finished but APK not found at $SRC_APK"

mkdir -p "$OUT_DIR"
cp "$SRC_APK" "$OUT_APK"
ok "Debug APK ready: $OUT_APK ($(du -h "$OUT_APK" | cut -f1))"

if [[ $ADB_INSTALL -eq 1 ]]; then
  ADB="$ANDROID_HOME/platform-tools/adb"
  command -v adb >/dev/null && ADB="adb"
  info "Installing on connected device…"
  "$ADB" install -r "$OUT_APK"
  ok "Installed."
fi
