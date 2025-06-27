# Baghchal Royale Frontend Setup Guide

## 🚀 Quick Setup

### Prerequisites

1. **Node.js** (v16 or higher)
   ```bash
   # Check your version
   node --version
   npm --version
   ```

2. **Expo CLI**
   ```bash
   npm install -g @expo/cli
   ```

3. **Git** (for cloning)
   ```bash
   git --version
   ```

### Installation Steps

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment**
   ```bash
   # Copy example environment file
   cp .env.example .env
   
   # Edit the .env file with your backend URLs
   API_URL=http://localhost:8000
   WS_URL=ws://localhost:8000
   ```

4. **Start development server**
   ```bash
   npx expo start
   ```

5. **Run on device/simulator**
   - **iOS Simulator**: Press `i` in terminal
   - **Android Emulator**: Press `a` in terminal
   - **Physical Device**: Scan QR code with Expo Go app

## 📱 Device Setup

### iOS Development

1. **Install Xcode** (from Mac App Store)
2. **Install iOS Simulator**
   ```bash
   xcode-select --install
   ```
3. **Open iOS Simulator**
   ```bash
   npx expo start --ios
   ```

### Android Development

1. **Install Android Studio**
2. **Set up Android Virtual Device (AVD)**
3. **Start Android Emulator**
   ```bash
   npx expo start --android
   ```

### Physical Device Testing

1. **Install Expo Go**
   - iOS: [App Store](https://apps.apple.com/app/expo-go/id982107779)
   - Android: [Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. **Connect to same network** as your development machine

3. **Scan QR code** from terminal or browser

## ⚙️ Configuration

### Backend Connection

Update your `.env` file with backend URLs:

```bash
# Development (local backend)
API_URL=http://localhost:8000
WS_URL=ws://localhost:8000

# Staging
API_URL=https://api-staging.baghchal-royale.com
WS_URL=wss://api-staging.baghchal-royale.com

# Production
API_URL=https://api.baghchal-royale.com
WS_URL=wss://api.baghchal-royale.com
```

### App Configuration

Modify `app.json` for your deployment:

```json
{
  "expo": {
    "name": "Baghchal Royale",
    "slug": "baghchal-royale",
    "scheme": "baghchal-royale",
    "extra": {
      "apiUrl": "http://localhost:8000",
      "wsUrl": "ws://localhost:8000"
    }
  }
}
```

## 🔧 Development Workflow

### Hot Reloading

The app supports hot reloading by default:
- Save any file to see changes instantly
- Shake device or press `r` to reload manually
- Press `d` to open developer menu

### Debugging

1. **React Native Debugger**
   ```bash
   # Install
   npm install -g react-native-debugger
   
   # Use
   # Press Ctrl+M (Android) or Cmd+D (iOS)
   # Select "Debug JS Remotely"
   ```

2. **Chrome DevTools**
   - Open browser debugger
   - Enable network inspection
   - View console logs

3. **Flipper** (Advanced)
   ```bash
   # Install Flipper desktop app
   # Add network and Redux plugins
   ```

### Code Quality

```bash
# Linting
npm run lint

# Type checking
npx tsc --noEmit

# Testing
npm test

# Format code
npm run format
```

## 📦 Building for Production

### Development Build

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure build
eas build:configure

# Build for development
eas build --profile development --platform all
```

### Production Build

```bash
# Build for app stores
eas build --profile production --platform all

# Submit to stores
eas submit --platform all
```

### Local Builds

```bash
# Android APK
npx expo run:android --variant release

# iOS IPA (requires macOS)
npx expo run:ios --configuration Release
```

## 🛠️ Troubleshooting

### Common Issues

#### Metro Bundler Errors

```bash
# Clear cache
npx expo start -c

# Reset Metro
npx expo start --clear

# Delete node_modules
rm -rf node_modules
npm install
```

#### iOS Simulator Issues

```bash
# Reset simulator
Device > Erase All Content and Settings

# Restart Xcode
sudo xcode-select --reset

# Update Xcode Command Line Tools
xcode-select --install
```

#### Android Emulator Issues

```bash
# Start emulator manually
emulator -avd <AVD_NAME>

# Check SDK installation
android list targets

# Update Android SDK
# Open Android Studio > SDK Manager
```

#### Network Connection Issues

```bash
# Check if backend is running
curl http://localhost:8000/health

# Verify WebSocket connection
wscat -c ws://localhost:8000/ws/test

# Check firewall settings
# Allow port 8000 and 19000-19002
```

#### TypeScript Errors

```bash
# Install type definitions
npm install --save-dev @types/react @types/react-native

# Check TypeScript configuration
npx tsc --showConfig

# Restart TypeScript language server
# VS Code: Cmd+Shift+P > "TypeScript: Restart TS Server"
```

### Performance Issues

#### Slow Metro Bundler

```bash
# Increase Node.js memory
export NODE_OPTIONS="--max-old-space-size=8192"

# Use faster bundler
npm install -g @expo/cli@latest
```

#### App Performance

```bash
# Enable Hermes (JavaScript engine)
# Add to app.json:
"expo": {
  "jsEngine": "hermes"
}

# Optimize bundle size
npx expo install --fix
```

## 🔍 Debugging Features

### Game State Debugging

Add this to your game screen:
```typescript
import { store } from '../store';

// Log game state
console.log('Game State:', store.getState().game);

// Subscribe to state changes
store.subscribe(() => {
  console.log('State changed:', store.getState());
});
```

### Network Debugging

Enable network logging:
```typescript
// In api.ts
const api = createApi({
  baseQuery: fetchBaseQuery({
    baseUrl,
    prepareHeaders: (headers, { getState }) => {
      console.log('API Request:', { getState });
      return headers;
    },
  }),
});
```

### WebSocket Debugging

Add connection logging:
```typescript
// In websocket service
ws.onopen = () => {
  console.log('WebSocket connected');
};

ws.onmessage = (event) => {
  console.log('WebSocket message:', event.data);
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};
```

## 📊 Performance Monitoring

### Bundle Analysis

```bash
# Analyze bundle size
npx expo export --dump-assetmap

# Check for large dependencies
npm ls --depth=0 --long
```

### Runtime Performance

```bash
# Enable performance monitoring
# Add to App.tsx:
import { enableScreens } from 'react-native-screens';
enableScreens();

# Monitor memory usage
# Use Flipper or React DevTools Profiler
```

## 🎯 VS Code Setup

### Recommended Extensions

```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-react-native",
    "expo.vscode-expo-tools",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint"
  ]
}
```

### Settings

```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "emmet.includeLanguages": {
    "typescript": "typescriptreact"
  }
}
```

## 🚀 Deployment Checklist

### Pre-deployment

- [ ] Update version in `app.json`
- [ ] Update API URLs for production
- [ ] Test on physical devices
- [ ] Run all tests
- [ ] Check bundle size
- [ ] Verify performance
- [ ] Test offline functionality

### App Store Preparation

- [ ] Create app store listings
- [ ] Prepare screenshots
- [ ] Write app descriptions
- [ ] Set up app store assets
- [ ] Configure privacy policies
- [ ] Test on various devices

### Go Live

- [ ] Build production version
- [ ] Submit to app stores
- [ ] Monitor crash reports
- [ ] Track user analytics
- [ ] Collect user feedback

---

Need help? Check our [troubleshooting guide](./docs/troubleshooting.md) or create an issue on GitHub! 