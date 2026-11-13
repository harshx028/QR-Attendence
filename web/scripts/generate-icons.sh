#!/usr/bin/env bash
# Regenerate the web logo, Android launcher icons and splash screens
# from the SVG sources in web/resources/.
#
# Requires: rsvg-convert (librsvg) and ImageMagick (`magick`).
set -euo pipefail

WEB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC="$WEB_DIR/resources"
RES="$WEB_DIR/android/app/src/main/res"
SPLASH_BG="#FFFFFF"

command -v rsvg-convert >/dev/null || { echo "rsvg-convert not found (install librsvg)"; exit 1; }
command -v magick >/dev/null || { echo "ImageMagick 'magick' not found"; exit 1; }

svg() { rsvg-convert -w "$2" -h "$2" "$1" -o "$3"; }

# Web
svg "$SRC/logo.svg" 512 "$WEB_DIR/public/logo.png"
cp "$SRC/logo.svg" "$WEB_DIR/public/logo.svg"

# Android launcher icons: density -> legacy size, adaptive foreground size
declare -A LEGACY=([mdpi]=48 [hdpi]=72 [xhdpi]=96 [xxhdpi]=144 [xxxhdpi]=192)
declare -A FG=([mdpi]=108 [hdpi]=162 [xhdpi]=216 [xxhdpi]=324 [xxxhdpi]=432)
for d in "${!LEGACY[@]}"; do
  svg "$SRC/logo.svg" "${LEGACY[$d]}" "$RES/mipmap-$d/ic_launcher.png"
  svg "$SRC/logo-round.svg" "${LEGACY[$d]}" "$RES/mipmap-$d/ic_launcher_round.png"
  svg "$SRC/logo-foreground.svg" "${FG[$d]}" "$RES/mipmap-$d/ic_launcher_foreground.png"
done

# Splash screens: logo centred on a plain background, ~24% of the short side
for f in "$RES"/drawable*/splash.png; do
  w=$(magick identify -format '%w' "$f")
  h=$(magick identify -format '%h' "$f")
  short=$(( w < h ? w : h ))
  size=$(( short * 24 / 100 ))
  tmp="$(mktemp --suffix=.png)"
  svg "$SRC/logo.svg" "$size" "$tmp"
  magick -size "${w}x${h}" "xc:$SPLASH_BG" "$tmp" -gravity center -composite \
    -alpha off -depth 8 -strip "$f"
  rm -f "$tmp"
done

echo "Icons and splash screens regenerated."
