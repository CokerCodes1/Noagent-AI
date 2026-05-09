# PWA Icon & Asset Generation Guide

This guide explains how to generate app icons and screenshots for your NoAgentNaija PWA.

## Required Assets

### 1. App Icons

All icons must be in **PNG format** with **transparent background**.

#### Required Sizes

| Filename | Size | Purpose | Maskable |
|----------|------|---------|----------|
| `icon-192.png` | 192×192 | Android Home Screen | ❌ |
| `icon-192-maskable.png` | 192×192 | Android Adaptive Icon | ✅ |
| `icon-512.png` | 512×512 | App Store Preview | ❌ |
| `icon-512-maskable.png` | 512×512 | App Store Preview | ✅ |
| `icon-96.png` | 96×96 | Notification Badge | ❌ |
| `icon-70.png` | 70×70 | Windows Tile | ❌ |
| `icon-150.png` | 150×150 | Windows Tile | ❌ |
| `icon-310.png` | 310×310 | Windows Tile | ❌ |
| `icon-310-wide.png` | 310×150 | Windows Tile (Wide) | ❌ |

**Location**: Save all to `frontend/public/`

### 2. Screenshots

For app store listings in manifest.

| Filename | Size | Aspect | Purpose |
|----------|------|--------|---------|
| `screenshot-narrow-1.png` | 540×720 | Portrait | Mobile app store |
| `screenshot-narrow-2.png` | 540×720 | Portrait | Mobile app store |
| `screenshot-wide-1.png` | 1280×720 | Landscape | Tablet/Desktop |
| `screenshot-wide-2.png` | 1280×720 | Landscape | Tablet/Desktop |

**Location**: Save all to `frontend/public/`

---

## Method 1: Using Online Tools (Easiest)

### PWA Asset Generator

Best for quick generation with your logo.

**Steps**:

1. Visit [PWA Asset Generator](https://www.pwabuilder.com/imageGenerator)
2. Upload your logo (PNG recommended, transparent background)
3. Set primary color: `#b85c38` (NoAgentNaija accent)
4. Select "Android" + "Apple" + "Windows"
5. Download the generated zip
6. Extract and copy all PNG files to `frontend/public/`

### Alternative Tools

- [Favicon Generator](https://www.favicon-generator.org/) - Quick icon generation
- [App Icon Generator](https://www.appicon.co/) - Icon resizing
- [Web App Manifest Generator](https://app-manifest.firebaseapp.com/) - Plus manifest generator

---

## Method 2: Using Command Line

### Using ImageMagick

```bash
# Install ImageMagick
# macOS
brew install imagemagick

# Ubuntu/Debian
sudo apt-get install imagemagick

# Windows (or use WSL)
# Download from https://imagemagick.org/

# Resize base logo to all required sizes
convert source-logo.png -resize 192x192 icon-192.png
convert source-logo.png -resize 192x192 -background none -gravity center -extent 192x192 icon-192-maskable.png
convert source-logo.png -resize 512x512 icon-512.png
convert source-logo.png -resize 512x512 -background none -gravity center -extent 512x512 icon-512-maskable.png
convert source-logo.png -resize 96x96 icon-96.png
convert source-logo.png -resize 70x70 icon-70.png
convert source-logo.png -resize 150x150 icon-150.png
convert source-logo.png -resize 310x310 icon-310.png
convert source-logo.png -resize 310x150 icon-310-wide.png
```

### Using Node.js Script

Create `frontend/scripts/generate-icons.js`:

```javascript
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const sourceImage = path.join(__dirname, '../source-logo.png');
const publicDir = path.join(__dirname, '../public');

const sizes = [
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-192-maskable.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: 'icon-512-maskable.png', size: 512 },
  { name: 'icon-96.png', size: 96 },
  { name: 'icon-70.png', size: 70 },
  { name: 'icon-150.png', size: 150 },
  { name: 'icon-310.png', size: 310 },
  { name: 'icon-310-wide.png', size: 310, height: 150 }
];

async function generateIcons() {
  for (const config of sizes) {
    const outputPath = path.join(publicDir, config.name);
    const height = config.height || config.size;

    console.log(`Generating ${config.name}...`);

    await sharp(sourceImage)
      .resize(config.size, height, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toFile(outputPath);

    console.log(`✓ ${config.name}`);
  }

  console.log('All icons generated!');
}

generateIcons().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
```

Install dependency:

```bash
npm install --save-dev sharp
```

Run:

```bash
node scripts/generate-icons.js
```

---

## Method 3: Using Design Tools

### Adobe XD / Figma

1. **Create Document**: Set size to 512×512 pixels
2. **Design Logo**: Use colors:
   - Primary: `#b85c38` (accent)
   - Secondary: `#8B4513` (darker)
   - Accents: `#e8d4c4` (light)
3. **Export Multiple Sizes**:
   - 192px: File → Export → PNG 192x192
   - 512px: File → Export → PNG 512x512
   - 96px: File → Export → PNG 96x96
   - 70px, 150px, 310px: Repeat export process
4. **Make Maskable**: Add padding (20% of size) with transparent background
5. **Save to** `frontend/public/`

### Photoshop

1. **New Document**: 512×512 px, transparent background
2. **Design**: Use accent color `#b85c38`
3. **Export**: File → Export As → PNG
4. **Resize**: Image → Image Size → desired dimensions
5. **Repeat** for all sizes

---

## Method 4: Using Bash Script (Recommended)

Create `frontend/scripts/setup-pwa-assets.sh`:

```bash
#!/bin/bash

set -e

echo "🎨 NoAgentNaija PWA Asset Setup"
echo "=============================="

# Check if source image exists
if [ ! -f "public/source-logo.png" ]; then
    echo "❌ Error: public/source-logo.png not found"
    echo "Please add your source logo (512×512px PNG) to public/source-logo.png"
    exit 1
fi

echo "✓ Source logo found"

# Install ImageMagick if not present
if ! command -v convert &> /dev/null; then
    echo "Installing ImageMagick..."
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        sudo apt-get install imagemagick
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        brew install imagemagick
    else
        echo "⚠ Please install ImageMagick from https://imagemagick.org/"
        exit 1
    fi
fi

echo "Generating icons..."

# Generate all required sizes
convert public/source-logo.png -resize 192x192 public/icon-192.png && echo "✓ icon-192.png"
convert public/source-logo.png -resize 192x192 public/icon-192-maskable.png && echo "✓ icon-192-maskable.png"
convert public/source-logo.png -resize 512x512 public/icon-512.png && echo "✓ icon-512.png"
convert public/source-logo.png -resize 512x512 public/icon-512-maskable.png && echo "✓ icon-512-maskable.png"
convert public/source-logo.png -resize 96x96 public/icon-96.png && echo "✓ icon-96.png"
convert public/source-logo.png -resize 70x70 public/icon-70.png && echo "✓ icon-70.png"
convert public/source-logo.png -resize 150x150 public/icon-150.png && echo "✓ icon-150.png"
convert public/source-logo.png -resize 310x310 public/icon-310.png && echo "✓ icon-310.png"
convert public/source-logo.png -resize 310x150 public/icon-310-wide.png && echo "✓ icon-310-wide.png"

echo ""
echo "✓ All icons generated successfully!"
echo ""
echo "Next steps:"
echo "1. Generate screenshots (540×720 and 1280×720)"
echo "2. Test PWA: npm run build && npm run preview"
echo "3. Install on device to verify icons appear"
```

Make executable:

```bash
chmod +x frontend/scripts/setup-pwa-assets.sh
```

Run:

```bash
./frontend/scripts/setup-pwa-assets.sh
```

---

## Screenshot Generation

### Using Tools

1. **Built-in Screenshots**:
   - Android: `adb shell screencap -p` or DevTools
   - iPhone: Hold Power + Volume Up simultaneously
   - Desktop: Windows Print Screen or macOS Cmd+Shift+3

2. **Figma Screenshots**:
   - Design mockup UI pages
   - Export as PNG at correct dimensions
   - Add app UI chrome around screenshot

3. **Screenshot Tools**:
   - [Chrome DevTools Device Emulation](https://developer.chrome.com/docs/devtools/device-mode/) - Best for web
   - [Responsively App](https://responsively.app/) - Multi-device screenshots
   - [Screenshot Machine](https://www.screenshotmachine.com/) - Online tool

### Screenshot Content Ideas

- **Screenshot 1 (narrow)**: Homepage hero section
- **Screenshot 2 (narrow)**: Dashboard/main feature
- **Screenshot 1 (wide)**: Property listing grid
- **Screenshot 2 (wide)**: Admin dashboard overview

---

## Verifying Your Assets

### Check Icon Files

```bash
# List all icon files
ls -lh frontend/public/icon-*.png

# Verify dimensions
file frontend/public/icon-*.png

# Using ImageMagick
identify frontend/public/icon-*.png
```

### Check Manifest References

```bash
# Verify all icons in manifest are generated
grep "src" frontend/public/manifest.json | grep icon
```

### Chrome DevTools Validation

1. Open DevTools → Application tab
2. Go to Manifest section
3. Check all icon paths resolve ✓
4. Check screenshot paths resolve ✓

### Lighthouse Audit

```bash
npm install -g lighthouse

# Run audit
lighthouse http://localhost:5173 --view

# Check PWA section
# Should show: ✓ Icons are properly sized
```

---

## Troubleshooting

### Icons Not Showing

1. **Check file exists**: `ls -la frontend/public/icon-*.png`
2. **Check manifest path**: Icon path must start with `/`
3. **Clear cache**: DevTools → Application → Clear site data
4. **Hard refresh**: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

### Installation Not Available

1. **Verify HTTPS**: PWA requires HTTPS (or localhost)
2. **Check manifest**: Must have size 192 icon, name, icons array
3. **Check start_url**: Must start with `/`
4. **Test with Lighthouse**

### Icons Too Large

```bash
# Optimize PNG compression
pngquant 256 icon-512.png --ext .png --force

# Or using ImageMagick
convert icon-512.png -strip icon-512-optimized.png
```

### Wrong Colors

Check if transparent background is being preserved:

```bash
# Add white background if needed
convert icon-192.png -background white -alpha remove icon-192-white.png

# Keep transparent
convert icon-192.png -format PNG -define png:color-type=6 icon-192.png
```

---

## Design Guidelines

### Color Scheme

- **Primary Accent**: `#b85c38` - Orange/brown
- **Dark**: `#593418` - Dark brown
- **Light**: `#f5efe5` - Cream
- **Success**: `#2f7a53` - Green
- **Danger**: `#b74232` - Red

### Logo Characteristics

- ✓ Distinctive and recognizable
- ✓ Works at all sizes (70px and up)
- ✓ Looks good on solid backgrounds (for maskable)
- ✓ Clear visibility on white and dark backgrounds
- ✓ Simple shapes (avoid thin lines)
- ✓ Avoid transparency inside (only background)

### Maskable Icon Best Practices

- Safe zone: Keep important content in center 40% of image
- Full bleed: Icon should fill entire square
- No rounded corners: Icon itself
- Transparent background: Exactly transparent, not white
- Test: Verify on both light and dark backgrounds

---

## Automated Testing

Add to package.json:

```json
{
  "scripts": {
    "generate-icons": "node scripts/generate-icons.js",
    "verify-icons": "node scripts/verify-icons.js",
    "test:pwa": "npm run build && npm run verify-icons"
  }
}
```

Create `frontend/scripts/verify-icons.js`:

```javascript
const fs = require('fs');
const path = require('path');

const requiredIcons = [
  'icon-192.png',
  'icon-192-maskable.png',
  'icon-512.png',
  'icon-512-maskable.png',
  'icon-96.png',
  'icon-70.png',
  'icon-150.png',
  'icon-310.png',
  'icon-310-wide.png'
];

const publicDir = path.join(__dirname, '../public');
const missing = [];

requiredIcons.forEach(icon => {
  const filePath = path.join(publicDir, icon);
  if (!fs.existsSync(filePath)) {
    missing.push(icon);
  } else {
    console.log(`✓ ${icon}`);
  }
});

if (missing.length > 0) {
  console.error(`\n❌ Missing icons: ${missing.join(', ')}`);
  process.exit(1);
} else {
  console.log('\n✓ All required icons found!');
}
```

Run:

```bash
npm run verify-icons
```

---

## Summary

1. **Prepare source logo**: 512×512 PNG with transparent background
2. **Choose generation method**: PWA Builder (easiest) or bash script
3. **Generate all sizes**: Run generation tool
4. **Verify in DevTools**: Check manifest references
5. **Test installation**: Install on device
6. **Create screenshots**: Capture and resize UI views
7. **Deploy**: Icons automatically served by web server

---

For issues or questions, check:
- [PWA Builder Docs](https://www.pwabuilder.com/)
- [Google PWA Checklist](https://web.dev/install-criteria/)
- [MDN Icons Reference](https://developer.mozilla.org/en-US/docs/Web/Manifest)
