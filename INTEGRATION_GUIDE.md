# Baghchal Royale - Frontend & Backend Integration Guide

## 🎯 Overview

This guide documents the complete integration of the React Native frontend with the FastAPI backend, including the enhanced Baghchal game logic with double Q-learning AI system.

## 🏗️ Architecture

### Backend (FastAPI)
- **Main API**: `/backend/app/main.py` - FastAPI application
- **Game Endpoints**: `/backend/app/api/v1/endpoints/games.py` - Complete game API
- **Game Logic**: `/backend/app/core/baghchal_env.py` - Core game environment
- **Enhanced AI**: `/backend/app/core/enhanced_ai.py` - Double Q-learning AI system
- **Game Utils**: `/backend/app/core/game_utils.py` - State management utilities
- **Database Models**: `/backend/app/models/game.py` - Game & Move models
- **Schemas**: `/backend/app/schemas/game.py` - API request/response schemas

### Frontend (React Native + Expo)
- **API Service**: `/frontend/src/services/api.ts` - RTK Query API integration
- **Game Components**: `/frontend/src/components/game/` - Game UI components
- **Game Screens**: `/frontend/src/screens/game/` - Game-related screens
- **State Management**: `/frontend/src/store/` - Redux store with game slice

## 🔌 API Endpoints

### Game Management
```
POST   /api/v1/games/create           # Create new game
GET    /api/v1/games/{game_id}/state  # Get game state
POST   /api/v1/games/{game_id}/move   # Make player move
POST   /api/v1/games/{game_id}/ai-move # Request AI move
GET    /api/v1/games/{game_id}        # Get game details
GET    /api/v1/games/{game_id}/reset  # Reset game
GET    /api/v1/games                  # List user games
GET    /api/v1/games/ai/status        # AI system status
```

### Authentication
```
POST   /api/v1/users/register         # User registration
POST   /api/v1/users/login            # User login
GET    /api/v1/users/profile          # Get user profile
GET    /api/v1/users/stats            # Get user statistics
```

## 🎮 Game Flow

### 1. Game Creation
```typescript
// Frontend
const { data } = await createGameMutation({
  mode: 'pvai',
  side: 'goats',
  difficulty: 'medium'
}).unwrap();

// Backend Response
{
  "success": true,
  "message": "Game created successfully",
  "data": {
    "game_id": "uuid-string",
    "mode": "pvai",
    "player_side": "goats",
    "ai_side": "tigers",
    "difficulty": "medium",
    "status": "active"
  }
}
```

### 2. Game State Retrieval
```typescript
// Frontend
const { data } = useGetGameStateQuery(gameId);

// Backend Response
{
  "success": true,
  "data": {
    "game_id": "uuid-string",
    "board": [[1,0,1,0,1], [0,0,0,0,0], ...],
    "phase": "PLACEMENT",
    "current_player": "GOAT",
    "goats_placed": 5,
    "goats_captured": 0,
    "game_over": false,
    "winner": null,
    "valid_actions": [
      {"type": "place", "row": 1, "col": 1},
      {"type": "place", "row": 1, "col": 2}
    ]
  }
}
```

### 3. Making Moves
```typescript
// Player Move
await makeMoveMutation({
  game_id: gameId,
  action_type: 'place',
  row: 2,
  col: 2
}).unwrap();

// AI Move
await getAIMoveMutation({
  game_id: gameId
}).unwrap();
```

## 🤖 AI System Integration

### AI Models
The enhanced AI system supports trained Q-learning models:
- `enhanced_tiger_dual.pkl` - Tiger AI with double Q-learning
- `enhanced_goat_dual.pkl` - Goat AI with double Q-learning
- Fallback rule-based AI if models not available

### AI Features
- **Double Q-Learning**: Advanced training technique for better strategy
- **Feature Engineering**: Strategic position evaluation
- **Confidence Scoring**: AI move confidence levels
- **Multiple Difficulties**: Easy, Medium, Hard skill levels

## 🗄️ Database Schema

### Game Model
```sql
CREATE TABLE games (
    id UUID PRIMARY KEY,
    game_mode VARCHAR NOT NULL,  -- 'pvp' or 'pvai'
    status VARCHAR DEFAULT 'active',  -- 'pending', 'active', 'finished'
    board_state JSONB NOT NULL,
    current_player VARCHAR NOT NULL,
    game_phase VARCHAR NOT NULL,
    goats_placed INTEGER DEFAULT 0,
    goats_captured INTEGER DEFAULT 0,
    player1_id UUID REFERENCES users(id),
    player2_id UUID REFERENCES users(id),
    player1_side VARCHAR NOT NULL,
    winner_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Move Model
```sql
CREATE TABLE moves (
    id UUID PRIMARY KEY,
    game_id UUID REFERENCES games(id),
    player_id UUID REFERENCES users(id),
    move_number INTEGER NOT NULL,
    move_data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
```

## 🚀 Setup & Running

### Backend Setup
```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Set environment variables
export DATABASE_URL="postgresql://user:pass@localhost/baghchal"

# Run migrations
alembic upgrade head

# Start enhanced server
python start_enhanced_server.py

# Or standard way
uvicorn app.main:app --reload
```

### Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Set API URL in app.json
{
  "expo": {
    "extra": {
      "apiUrl": "http://localhost:8000"
    }
  }
}

# Start development server
expo start
```

## 🧪 Testing

### Backend Testing
```bash
cd backend

# Test the integrated API
python test_game_api.py

# Test simple game server (standalone)
python simple_game_server.py
```

### Frontend Testing
```bash
cd frontend

# Run tests
npm test

# Test on device/simulator
expo start --ios  # or --android
```

## 🔧 Configuration

### Environment Variables
```bash
# Backend
DATABASE_URL=postgresql://user:pass@localhost/baghchal
SECRET_KEY=your-secret-key
CORS_ORIGINS=["http://localhost:3000", "exp://localhost:19000"]

# Frontend (app.json)
{
  "expo": {
    "extra": {
      "apiUrl": "http://localhost:8000"
    }
  }
}
```

## 📊 Game State Management

### State Structure
```typescript
interface GameState {
  game_id: string;
  board: number[][];           // 5x5 grid: 0=empty, 1=tiger, 2=goat
  phase: 'PLACEMENT' | 'MOVEMENT';
  current_player: 'TIGER' | 'GOAT';
  goats_placed: number;        // 0-20
  goats_captured: number;      // 0-5 for tiger win
  game_over: boolean;
  winner: string | null;
  valid_actions: Action[];
}
```

### Actions
```typescript
interface PlaceAction {
  type: 'place';
  row: number;
  col: number;
}

interface MoveAction {
  type: 'move';
  from_row: number;
  from_col: number;
  to_row: number;
  to_col: number;
}
```

## 🎯 Key Features Implemented

### ✅ Complete Game Logic
- Full Baghchal rule implementation
- Two-phase gameplay (placement → movement)
- Tiger capture mechanics
- Win condition detection

### ✅ Enhanced AI System
- Double Q-learning trained models
- Strategic feature extraction
- Confidence-based move selection
- Fallback rule-based AI

### ✅ Real-time State Management
- In-memory active game sessions
- Database persistence
- State reconstruction from DB
- Game state validation

### ✅ Frontend Integration
- RTK Query API integration
- Real-time game state updates
- Move validation
- Error handling

### ✅ Authentication & Users
- JWT-based authentication
- User profiles and statistics
- Game history tracking
- Rating system (ELO-like)

## 🔍 Debugging

### Common Issues

1. **AI Models Not Loading**
   - Check model files exist in backend directory
   - Verify file permissions
   - Check console output for AI initialization

2. **Database Connection Issues**
   - Verify DATABASE_URL is set correctly
   - Run database migrations
   - Check database server is running

3. **Frontend API Connection Issues**
   - Verify API URL in app.json
   - Check CORS settings in backend
   - Ensure backend server is running

### Logging
- Backend: Uses FastAPI's built-in logging
- Frontend: Use React Native Flipper for debugging
- Game state: Available in browser DevTools (Redux DevTools)

## 🚀 Production Deployment

### Backend
- Use PostgreSQL for production database
- Set proper environment variables
- Use process manager (PM2, supervisord)
- Configure reverse proxy (nginx)

### Frontend
- Build for production: `expo build`
- Deploy to App Store / Google Play
- Update API URL for production

## 🎉 Success!

The Baghchal Royale frontend and backend are now fully integrated with:
- Complete game logic with enhanced AI
- Real-time multiplayer capabilities
- Persistent game state
- Professional API structure
- Robust error handling

The game is ready for development, testing, and deployment! 🎮 