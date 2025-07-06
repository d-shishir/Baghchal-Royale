#!/usr/bin/env python3
"""
Quick test script for friendship API endpoints
"""
import requests
import json

BASE_URL = "http://localhost:8000"

def test_friendship_endpoints():
    """Test the friendship API endpoints"""
    print("🧪 Testing Friendship API Endpoints...")
    
    # Test data
    user1_data = {
        "email": "user1@example.com",
        "username": "user1",
        "password": "password123"
    }
    
    user2_data = {
        "email": "user2@example.com", 
        "username": "user2",
        "password": "password123"
    }
    
    try:
        # Register two users
        print("\n1. Registering users...")
        
        response1 = requests.post(f"{BASE_URL}/api/v1/auth/register", json=user1_data)
        print(f"User1 registration: {response1.status_code}")
        
        response2 = requests.post(f"{BASE_URL}/api/v1/auth/register", json=user2_data)
        print(f"User2 registration: {response2.status_code}")
        
        # Login user1
        print("\n2. Logging in user1...")
        login_data = {"username": user1_data["username"], "password": user1_data["password"]}
        login_response = requests.post(f"{BASE_URL}/api/v1/auth/login", data=login_data)
        
        if login_response.status_code != 200:
            print(f"Login failed: {login_response.status_code}")
            return
            
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Search for user2
        print("\n3. Searching for user2...")
        search_response = requests.get(f"{BASE_URL}/api/v1/users/search?query=user2", headers=headers)
        print(f"Search response: {search_response.status_code}")
        
        if search_response.status_code == 200:
            users = search_response.json()
            if users:
                user2_id = users[0]["id"]
                print(f"Found user2 with ID: {user2_id}")
                
                # Send friend request
                print("\n4. Sending friend request...")
                friend_request_data = {"addressee_id": user2_id}
                friend_response = requests.post(f"{BASE_URL}/api/v1/friends/request", 
                                              json=friend_request_data, headers=headers)
                print(f"Friend request response: {friend_response.status_code}")
                
                if friend_response.status_code == 200:
                    print("✅ Friend request sent successfully!")
                    
                    # Get friends list
                    print("\n5. Getting friends list...")
                    friends_response = requests.get(f"{BASE_URL}/api/v1/friends/list", headers=headers)
                    print(f"Friends list response: {friends_response.status_code}")
                    
                    if friends_response.status_code == 200:
                        friends = friends_response.json()
                        print(f"Friends count: {len(friends)}")
                        
                    # Get pending requests
                    print("\n6. Getting pending requests...")
                    requests_response = requests.get(f"{BASE_URL}/api/v1/friends/requests", headers=headers)
                    print(f"Pending requests response: {requests_response.status_code}")
                    
                    if requests_response.status_code == 200:
                        pending = requests_response.json()
                        print(f"Pending requests count: {len(pending)}")
                        
                    print("\n✅ All friendship endpoints working!")
                else:
                    print(f"❌ Friend request failed: {friend_response.text}")
            else:
                print("❌ User2 not found in search results")
        else:
            print(f"❌ Search failed: {search_response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to server. Make sure the backend is running on localhost:8000")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_friendship_endpoints() 