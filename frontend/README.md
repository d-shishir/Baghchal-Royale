# Baghchal Royale - Frontend

A modern React Native implementation of the traditional Nepali board game Baghchal (Tigers and Goats), featuring multiplayer capabilities, AI opponents, and comprehensive user management.

## Features

### 🎮 Game Features
- **Traditional Baghchal gameplay** - 4 Tigers vs 20 Goats
- **Single Player Mode** - Play against AI with different difficulty levels
- **Multiplayer Mode** - Real-time PvP matches
- **Guest Mode** - Play without creating an account
- **Move validation** - Ensures fair play with proper game rules

### 👤 User Management
- **User Registration & Login** - Secure authentication system
- **Profile Management** - Customize your gaming profile
- **Statistics Tracking** - Games played, wins, rating progression
- **Leaderboards** - Compete with players worldwide
- **Achievement System** - Unlock achievements as you play

### 🏆 Competitive Features
- **ELO Rating System** - Skill-based matchmaking
- **Win/Loss Tracking** - Detailed game history
- **Side Performance** - Track your success as Tigers vs Goats
- **Real-time Updates** - Live leaderboard and stats

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator (Mac) or Android Emulator
- Running backend server (see backend README)

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd "Baghchal Royale/frontend"
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   - The app is configured to connect to `http://localhost:8000` by default
   - To change the backend URL, edit `app.json`:
   ```json
   {
     "expo": {
       "extra": {
         "apiUrl": "your-backend-url",
         "wsUrl": "your-websocket-url"
       }
     }
   }
   ```

## Running the App

### Development Mode

1. **Start the backend server first**
   ```bash
   cd ../backend
   python start_backend.py
   ```

2. **Start the frontend**
   ```bash
   npm start
   ```

3. **Choose your platform:**
   - Press `i` for iOS Simulator
   - Press `a` for Android Emulator
   - Press `w` for Web browser
   - Scan QR code with Expo Go app on your phone

### Running on Different Platforms

#### iOS Simulator (Mac only)
```bash
npm run ios
```

#### Android Emulator
```bash
npm run android
```

#### Web Browser
```bash
npm run web
```

## Project Structure

```
frontend/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── game/           # Game-specific components
│   │   └── LoadingScreen.tsx
│   ├── containers/         # Container components
│   ├── contexts/           # React contexts
│   ├── navigation/         # Navigation configuration
│   ├── screens/            # Screen components
│   │   ├── auth/          # Authentication screens
│   │   ├── game/          # Game screens
│   │   ├── home/          # Home screen
│   │   ├── leaderboard/   # Leaderboard screen
│   │   ├── profile/       # Profile screen
│   │   └── ...
│   ├── services/          # API and external services
│   ├── store/             # Redux store configuration
│   │   └── slices/        # Redux slices
│   └── theme/             # UI theme configuration
├── App.tsx               # Root component
├── app.json             # Expo configuration
└── package.json         # Dependencies
```

## Authentication Flow

### Guest Mode
- Quick access without registration
- Limited features (no multiplayer, no stats)
- Local gameplay only

### Registered Users
- Full feature access
- Profile customization
- Multiplayer capabilities
- Statistics and leaderboards
- Achievement system

## API Integration

The frontend integrates with the backend through:

- **RTK Query** - For API calls and state management
- **Redux Toolkit** - For global state management
- **Auto-refresh tokens** - Seamless authentication
- **Error handling** - User-friendly error messages

### Key API Endpoints Used

- `POST /users/register` - User registration
- `POST /users/login` - User authentication
- `GET /users/profile` - User profile data
- `GET /users/leaderboard` - Leaderboard data
- `POST /game/create` - Create new game
- `POST /game/{id}/move` - Make game moves
- `POST /game/{id}/ai-move` - Get AI moves

## Game Modes

### Single Player
- Play against AI opponents
- Three difficulty levels: Easy, Medium, Hard
- Choose to play as Tigers or Goats
- Offline capability

### Multiplayer
- Real-time PvP matches
- Matchmaking system
- Turn-based gameplay
- Live game state synchronization

## Configuration

### Backend Connection
Edit `app.json` to configure backend connection:
```json
{
  "expo": {
    "extra": {
      "apiUrl": "http://your-backend-url:8000",
      "wsUrl": "ws://your-backend-url:8000"
    }
  }
}
```

### Development vs Production
- Development: Uses localhost URLs
- Production: Configure with your deployed backend URLs

## Troubleshooting

### Common Issues

1. **"Network request failed"**
   - Ensure backend server is running
   - Check if the API URL in `app.json` is correct
   - For iOS Simulator, use `http://localhost:8000`
   - For Android Emulator, use `http://10.0.2.2:8000`

2. **"Unable to connect to development server"**
   - Restart the Expo development server
   - Clear Expo cache: `expo start -c`

3. **Authentication issues**
   - Clear app data/storage
   - Restart the app
   - Check backend logs for authentication errors

4. **Game state not updating**
   - Check network connection
   - Ensure backend WebSocket is working
   - Restart the game session

### Development Tips

- Use **Flipper** for debugging Redux state
- Enable **Remote Debugging** for detailed logs
- Use **Expo DevTools** for network inspection
- Check **Metro bundler** logs for build issues

## Building for Production

### Android APK
```bash
expo build:android
```

### iOS IPA
```bash
expo build:ios
```

### Web
```bash
npm run build:web
```

## Contributing

1. Follow the existing code structure
2. Use TypeScript for type safety
3. Follow React Native best practices
4. Test on both iOS and Android
5. Update documentation for new features

## Performance Optimization

- Images are optimized for different screen densities
- Redux state is persisted efficiently
- API calls are cached using RTK Query
- Components are memoized where appropriate

## Security

- API tokens are stored securely
- Sensitive data is not logged
- Input validation on all forms
- Secure authentication flow

---

For backend setup and API documentation, see the backend README.md file. 