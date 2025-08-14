# Android Emulator Setup - Baghchal Royale

## ✅ Setup Complete!

Your Android development environment has been successfully configured. Here's what was done:

### Environment Variables Added to ~/.zshrc and ~/.bash_profile

```bash
# Android SDK Configuration
export ANDROID_HOME=$HOME/Library/Android/sdk
export ANDROID_SDK_ROOT=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
```

**Note:** These variables are configured for both zsh and bash shells to ensure compatibility.

### Available Commands

Now you can use these commands from any terminal:

```bash
# List available Android Virtual Devices
emulator -list-avds

# Start an emulator
emulator -avd Pixel_9

# Check connected devices
adb devices

# Run React Native app on Android
cd frontend
npx expo run:android
```

### Available Emulator

- **Pixel_9** - Ready to use Android emulator

### How to Use

1. **Start the emulator:**
   ```bash
   emulator -avd Pixel_9
   ```

2. **Wait for the emulator to fully boot** (may take 1-2 minutes)

3. **Run your React Native app:**
   ```bash
   cd frontend
   npx expo run:android
   ```

### Troubleshooting

If you encounter issues:

1. **Restart your terminal** to load the new environment variables
2. **Check if emulator is running:** `adb devices`
3. **Verify paths:** `which emulator` and `which adb`
4. **Start emulator with more options:**
   ```bash
   emulator -avd Pixel_9 -no-snapshot -wipe-data
   ```

### Creating New Emulators

To create additional emulators, use Android Studio:
1. Open Android Studio
2. Go to Tools → AVD Manager
3. Create Virtual Device
4. Choose device type and Android version

### Notes

- The emulator may take some time to start the first time
- Make sure to have enough system resources (RAM/CPU) for smooth emulation
- You can run the emulator in the background while developing

## Ready to Develop! 🚀

Your Android development environment is now fully configured. You can start developing and testing your Baghchal Royale mobile app on Android emulators.
