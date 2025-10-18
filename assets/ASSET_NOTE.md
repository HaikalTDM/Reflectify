# Asset Files Note

## Current Status

The assets directory contains **SVG placeholder files** for development. These work in Expo but should be converted to PNG for production builds.

## SVG Files (Current)
- icon.svg
- splash.svg
- adaptive-icon.svg
- favicon.svg
- notification-icon.svg

## Required PNG Files (For Production)

### Required Sizes:
- **icon.png**: 1024×1024px
- **splash.png**: 2048×2048px (or 1284×2778px for newer devices)
- **adaptive-icon.png**: 1024×1024px
- **favicon.png**: 48×48px
- **notification-icon.png**: 96×96px (Android only)

## Converting SVG to PNG

### Option 1: Online Tools
- [CloudConvert](https://cloudconvert.com/svg-to-png)
- [SVG to PNG Converter](https://svgtopng.com/)
- [Online-Convert](https://image.online-convert.com/convert-to-png)

### Option 2: Command Line (ImageMagick)
```bash
# Install ImageMagick first
brew install imagemagick  # macOS
# or
apt-get install imagemagick  # Linux

# Convert
convert icon.svg -resize 1024x1024 icon.png
convert splash.svg -resize 2048x2048 splash.png
convert adaptive-icon.svg -resize 1024x1024 adaptive-icon.png
convert favicon.svg -resize 48x48 favicon.png
convert notification-icon.svg -resize 96x96 notification-icon.png
```

### Option 3: Design Tools
- **Figma**: Export as PNG at required sizes
- **Adobe Illustrator**: File → Export → PNG
- **Sketch**: Export → PNG at required dimensions

## Quick Solution for Testing

For immediate testing, you can:
1. Use the Expo default assets (app works without custom assets)
2. Or generate basic PNGs using: [AppIcon.co](https://www.appicon.co/)

## Design Guidelines

When creating custom assets, follow these guidelines:

### Color Palette
- Primary: `#d4af37` (Gold)
- Secondary: `#1a1a1a` (Black)
- Background: `#ffffff` (White)

### Icon Design
- Simple, recognizable symbol
- Clean lines, minimal details
- Good contrast for visibility
- Represents "reflection" or "pause" concept
- Consider: leaf 🍃, crescent moon 🌙, book 📖, or lotus 🪷

### Splash Screen
- App name: "Reflectify"
- Tagline: "Pause. Reflect. Grow."
- Centered composition
- Light background for universal appeal

## For Development

The app will work perfectly fine with SVG placeholders or even with warnings about missing assets. Expo Go will use default icons if needed. You only need proper PNG assets when building for production (App Store/Play Store).

