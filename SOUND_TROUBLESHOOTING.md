# Sound Effects Troubleshooting

## Why am I not hearing sounds?

### 1. ✅ Check Sound Files
Make sure you have these files in `assets/sounds/`:
- `correct.mp3`
- `wrong.mp3`
- `complete.mp3`

### 2. 🔊 Check Settings
1. Open the app
2. Go to **Settings**
3. Scroll to **SOUND** section
4. Make sure **Sound Effects** toggle is **ON** (enabled)

### 3. 📱 Check Device Volume
- Make sure your device volume is turned up
- Check if silent mode is OFF
- On iOS: Check the physical silent switch

### 4. 🔍 Check Console Logs
Look for these messages in the console/terminal:
- `✅ Sound effects loaded successfully`
- `✅ Loaded sound: correct`
- `✅ Loaded sound: wrong`
- `✅ Loaded sound: complete`
- `🔊 Sound enabled in settings`

When you answer a question, you should see:
- `🔊 Playing sound: correct` (for correct answers)
- `🔊 Playing sound: wrong` (for wrong answers)
- `🔊 Playing sound: complete` (when quiz finishes)

If you see `🔇 Sound [name] muted`, go to Settings and enable sound.

### 5. 🔄 Restart the App
Sometimes you need to fully close and restart the app for sounds to load properly.

### 6. 📦 Expo Go Limitations
If using Expo Go:
- Some audio features might have limitations
- Try building a development build: `npx expo run:android` or `npx expo run:ios`

### 7. 🎵 Test Your Sound Files
Make sure your MP3 files are:
- Valid audio files (not corrupted)
- Short duration (0.5-2 seconds recommended)
- Reasonable file size (< 100KB recommended)
- Standard format (MP3, 44.1kHz, 128kbps+)

## Quick Test
1. Go to Settings
2. Toggle Sound Effects OFF then ON
3. You should see a toast: "Sound effects enabled"
4. Start a reflection and answer a quiz question
5. You should hear a sound!

## Still Not Working?
Check the console for error messages starting with `❌` - this will tell you what went wrong.

