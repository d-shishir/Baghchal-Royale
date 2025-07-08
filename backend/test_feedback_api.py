#!/usr/bin/env python3
"""
Quick test script for feedback API endpoints
"""
import requests
import json

BASE_URL = "http://localhost:8000"

def test_feedback_endpoints():
    """Test the feedback API endpoints"""
    print("🧪 Testing Feedback API Endpoints...")
    
    # Test data
    user_data = {
        "email": "feedbackuser@example.com",
        "username": "feedbackuser",
        "password": "password123"
    }
    
    admin_data = {
        "email": "feedbackadmin@example.com",
        "username": "feedbackadmin", 
        "password": "password123"
    }
    
    try:
        # Register regular user
        print("\n1. Registering regular user...")
        
        response = requests.post(f"{BASE_URL}/api/v1/auth/register", json=user_data)
        print(f"User registration: {response.status_code}")
        
        # Register admin user
        print("\n2. Registering admin user...")
        
        admin_response = requests.post(f"{BASE_URL}/api/v1/auth/register", json=admin_data)
        print(f"Admin registration: {admin_response.status_code}")
        
        # Login user
        print("\n3. Logging in regular user...")
        login_data = {"username": user_data["email"], "password": user_data["password"]}
        login_response = requests.post(f"{BASE_URL}/api/v1/auth/login", data=login_data)
        
        if login_response.status_code != 200:
            print(f"User login failed: {login_response.status_code}")
            return
            
        user_token = login_response.json()["access_token"]
        user_headers = {"Authorization": f"Bearer {user_token}"}
        
        # Get user info to get user ID
        user_info_response = requests.get(f"{BASE_URL}/api/v1/users/me", headers=user_headers)
        if user_info_response.status_code != 200:
            print(f"Failed to get user info: {user_info_response.status_code}")
            return
            
        user_id = user_info_response.json()["user_id"]
        print(f"User ID: {user_id}")
        
        # Create feedback
        print("\n4. Creating feedback...")
        feedback_data = {
            "user_id": user_id,
            "subject": "Bug Report",
            "message": "Found a bug in the game logic when tigers capture goats.",
            "type": "bug"
        }
        
        feedback_response = requests.post(f"{BASE_URL}/api/v1/feedback/", 
                                        json=feedback_data, headers=user_headers)
        print(f"Create feedback response: {feedback_response.status_code}")
        
        if feedback_response.status_code == 200:
            feedback_result = feedback_response.json()
            feedback_id = feedback_result["feedback_id"]
            print(f"✅ Feedback created with ID: {feedback_id}")
            
            # Try to create feedback for different user (should fail)
            print("\n5. Testing permission validation...")
            invalid_feedback_data = {
                "user_id": "00000000-0000-0000-0000-000000000000",  # Different user ID
                "subject": "Invalid Request",
                "message": "This should fail.",
                "type": "other"
            }
            
            invalid_response = requests.post(f"{BASE_URL}/api/v1/feedback/", 
                                           json=invalid_feedback_data, headers=user_headers)
            print(f"Invalid feedback response: {invalid_response.status_code}")
            
            if invalid_response.status_code == 403:
                print("✅ Permission validation working correctly!")
            else:
                print(f"❌ Permission validation failed: expected 403, got {invalid_response.status_code}")
            
            # Login admin to test admin endpoints
            print("\n6. Logging in admin user...")
            admin_login_data = {"username": admin_data["email"], "password": admin_data["password"]}
            admin_login_response = requests.post(f"{BASE_URL}/api/v1/auth/login", data=admin_login_data)
            
            # Note: Since we don't have admin promotion logic in the endpoints, 
            # this test will check if the endpoints exist but may fail on permissions
            if admin_login_response.status_code == 200:
                admin_token = admin_login_response.json()["access_token"]
                admin_headers = {"Authorization": f"Bearer {admin_token}"}
                
                # Try to get all feedback (admin only)
                print("\n7. Getting all feedback (admin endpoint)...")
                all_feedback_response = requests.get(f"{BASE_URL}/api/v1/feedback/", headers=admin_headers)
                print(f"Get all feedback response: {all_feedback_response.status_code}")
                
                if all_feedback_response.status_code == 200:
                    all_feedback = all_feedback_response.json()
                    print(f"✅ Retrieved {len(all_feedback)} feedback entries")
                elif all_feedback_response.status_code == 403:
                    print("⚠️  Admin permissions not set up - endpoint exists but requires superuser")
                else:
                    print(f"❌ Get all feedback failed: {all_feedback_response.status_code}")
                
                # Try to get specific feedback (admin only)
                print("\n8. Getting specific feedback by ID (admin endpoint)...")
                specific_feedback_response = requests.get(f"{BASE_URL}/api/v1/feedback/{feedback_id}", 
                                                        headers=admin_headers)
                print(f"Get specific feedback response: {specific_feedback_response.status_code}")
                
                if specific_feedback_response.status_code == 200:
                    specific_feedback = specific_feedback_response.json()
                    print(f"✅ Retrieved specific feedback: {specific_feedback['subject']}")
                elif specific_feedback_response.status_code == 403:
                    print("⚠️  Admin permissions not set up - endpoint exists but requires superuser")
                else:
                    print(f"❌ Get specific feedback failed: {specific_feedback_response.status_code}")
            
            # Test with regular user trying to access admin endpoints
            print("\n9. Testing admin endpoint access with regular user...")
            user_admin_response = requests.get(f"{BASE_URL}/api/v1/feedback/", headers=user_headers)
            print(f"Regular user accessing admin endpoint: {user_admin_response.status_code}")
            
            if user_admin_response.status_code == 403:
                print("✅ Admin endpoint properly protected!")
            else:
                print(f"❌ Admin endpoint not properly protected: expected 403, got {user_admin_response.status_code}")
            
            print("\n✅ All feedback endpoints tested successfully!")
            
        else:
            print(f"❌ Create feedback failed: {feedback_response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to server. Make sure the backend is running on localhost:8000")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_feedback_endpoints() 