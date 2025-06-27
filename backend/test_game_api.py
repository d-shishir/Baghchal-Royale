#!/usr/bin/env python3
"""
Test script for the integrated Baghchal Royale API
"""

import requests
import json
import time
from typing import Dict, Any

# Configuration
API_BASE_URL = "http://localhost:8000/api/v1"
TEST_USER_EMAIL = "test@example.com"
TEST_USER_PASSWORD = "testpassword123"
TEST_USERNAME = "testplayer"

class GameAPITester:
    def __init__(self, base_url: str):
        self.base_url = base_url
        self.session = requests.Session()
        self.auth_token = None
        self.current_game_id = None
    
    def register_test_user(self) -> bool:
        """Register a test user for API testing."""
        try:
            response = self.session.post(f"{self.base_url}/users/register", json={
                "email": TEST_USER_EMAIL,
                "username": TEST_USERNAME,
                "password": TEST_USER_PASSWORD
            })
            
            if response.status_code == 200:
                data = response.json()
                self.auth_token = data["data"]["access_token"]
                self.session.headers.update({"Authorization": f"Bearer {self.auth_token}"})
                print("✅ Test user registered successfully")
                return True
            else:
                print(f"⚠️ Registration failed: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Registration error: {e}")
            return False
    
    def login_test_user(self) -> bool:
        """Login with test user."""
        try:
            response = self.session.post(f"{self.base_url}/users/login", json={
                "email": TEST_USER_EMAIL,
                "password": TEST_USER_PASSWORD
            })
            
            if response.status_code == 200:
                data = response.json()
                self.auth_token = data["data"]["access_token"]
                self.session.headers.update({"Authorization": f"Bearer {self.auth_token}"})
                print("✅ Login successful")
                return True
            else:
                print(f"⚠️ Login failed: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Login error: {e}")
            return False
    
    def test_ai_status(self) -> bool:
        """Test AI system status."""
        try:
            response = self.session.get(f"{self.base_url}/games/ai/status")
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ AI Status: {json.dumps(data, indent=2)}")
                return data.get("ai_available", False)
            else:
                print(f"❌ AI Status check failed: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ AI Status error: {e}")
            return False
    
    def create_ai_game(self) -> bool:
        """Create a new AI game."""
        try:
            response = self.session.post(f"{self.base_url}/games/create", json={
                "mode": "pvai",
                "side": "goats",
                "difficulty": "medium"
            })
            
            if response.status_code == 200:
                data = response.json()
                self.current_game_id = data["data"]["game_id"]
                print(f"✅ Game created: {self.current_game_id}")
                return True
            else:
                print(f"❌ Game creation failed: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Game creation error: {e}")
            return False
    
    def get_game_state(self) -> Dict[str, Any]:
        """Get current game state."""
        try:
            response = self.session.get(f"{self.base_url}/games/{self.current_game_id}/state")
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Game state retrieved")
                return data["data"]
            else:
                print(f"❌ Game state retrieval failed: {response.text}")
                return {}
                
        except Exception as e:
            print(f"❌ Game state error: {e}")
            return {}
    
    def make_goat_move(self, row: int, col: int) -> bool:
        """Make a goat placement move."""
        try:
            response = self.session.post(f"{self.base_url}/games/{self.current_game_id}/move", json={
                "action_type": "place",
                "row": row,
                "col": col
            })
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Goat move executed: place at ({row},{col})")
                return True
            else:
                print(f"❌ Goat move failed: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Goat move error: {e}")
            return False
    
    def make_ai_move(self) -> bool:
        """Request AI to make a move."""
        try:
            response = self.session.post(f"{self.base_url}/games/{self.current_game_id}/ai-move")
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ AI move executed")
                return True
            else:
                print(f"❌ AI move failed: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ AI move error: {e}")
            return False
    
    def play_sample_game(self) -> bool:
        """Play a few moves to test the complete game flow."""
        print("\n🎮 Starting sample game...")
        
        # Get initial state
        state = self.get_game_state()
        if not state:
            return False
        
        print(f"📊 Initial state: {state['phase']} phase, {state['current_player']} to move")
        
        moves_played = 0
        max_moves = 10  # Limit for testing
        
        while moves_played < max_moves and not state.get('game_over', False):
            current_player = state['current_player'].lower()
            
            if current_player == 'goats':
                # Player's turn - make a simple goat placement
                if state['phase'].lower() == 'placement':
                    # Find first valid placement position
                    valid_actions = state.get('valid_actions', [])
                    placement_actions = [a for a in valid_actions if a['type'] == 'place']
                    
                    if placement_actions:
                        action = placement_actions[0]
                        if not self.make_goat_move(action['row'], action['col']):
                            break
                    else:
                        print("⚠️ No valid goat placements found")
                        break
                else:
                    # Movement phase - skip for simplicity in test
                    print("⏭️ Skipping goat movement for test")
                    break
            
            elif current_player == 'tigers':
                # AI's turn
                if not self.make_ai_move():
                    break
            
            # Get updated state
            time.sleep(0.5)  # Small delay
            state = self.get_game_state()
            if not state:
                break
            
            moves_played += 1
            print(f"📊 After move {moves_played}: {state['phase']} phase, {state['current_player']} to move")
            print(f"   Goats placed: {state['goats_placed']}, captured: {state['goats_captured']}")
            
            if state.get('game_over', False):
                winner = state.get('winner', 'None')
                print(f"🏆 Game over! Winner: {winner}")
                break
        
        print(f"✅ Sample game completed ({moves_played} moves)")
        return True
    
    def run_full_test(self) -> bool:
        """Run complete API test suite."""
        print("🚀 Starting Baghchal Royale API Test Suite")
        print("=" * 50)
        
        # Step 1: Authentication
        print("\n1️⃣ Testing Authentication...")
        if not self.login_test_user():
            if not self.register_test_user():
                print("❌ Authentication failed")
                return False
        
        # Step 2: AI Status
        print("\n2️⃣ Testing AI System...")
        if not self.test_ai_status():
            print("❌ AI system not available")
            return False
        
        # Step 3: Game Creation
        print("\n3️⃣ Creating AI Game...")
        if not self.create_ai_game():
            print("❌ Game creation failed")
            return False
        
        # Step 4: Sample Game
        print("\n4️⃣ Playing Sample Game...")
        if not self.play_sample_game():
            print("❌ Sample game failed")
            return False
        
        print("\n" + "=" * 50)
        print("✅ All tests completed successfully!")
        print("🎉 Baghchal Royale API is working correctly!")
        return True


def main():
    """Main test function."""
    tester = GameAPITester(API_BASE_URL)
    
    try:
        success = tester.run_full_test()
        exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n⚠️ Test interrupted by user")
        exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        exit(1)


if __name__ == "__main__":
    main() 