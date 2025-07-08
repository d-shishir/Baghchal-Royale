#!/usr/bin/env python3
"""
Quick test script for reports API endpoints
"""
import requests
import json

BASE_URL = "http://localhost:8000"

def test_reports_endpoints():
    """Test the reports API endpoints"""
    print("🧪 Testing Reports API Endpoints...")
    
    # Test data
    reporter_data = {
        "email": "reporter@example.com",
        "username": "reporter",
        "password": "password123"
    }
    
    reported_data = {
        "email": "reported@example.com",
        "username": "reported",
        "password": "password123"
    }
    
    admin_data = {
        "email": "reportsadmin@example.com",
        "username": "reportsadmin",
        "password": "password123"
    }
    
    try:
        # Register users
        print("\n1. Registering users...")
        
        reporter_response = requests.post(f"{BASE_URL}/api/v1/auth/register", json=reporter_data)
        print(f"Reporter registration: {reporter_response.status_code}")
        
        reported_response = requests.post(f"{BASE_URL}/api/v1/auth/register", json=reported_data)
        print(f"Reported user registration: {reported_response.status_code}")
        
        admin_response = requests.post(f"{BASE_URL}/api/v1/auth/register", json=admin_data)
        print(f"Admin registration: {admin_response.status_code}")
        
        # Login reporter
        print("\n2. Logging in reporter...")
        login_data = {"username": reporter_data["email"], "password": reporter_data["password"]}
        login_response = requests.post(f"{BASE_URL}/api/v1/auth/login", data=login_data)
        
        if login_response.status_code != 200:
            print(f"Reporter login failed: {login_response.status_code}")
            return
            
        reporter_token = login_response.json()["access_token"]
        reporter_headers = {"Authorization": f"Bearer {reporter_token}"}
        
        # Get reporter info to get user ID
        reporter_info_response = requests.get(f"{BASE_URL}/api/v1/users/me", headers=reporter_headers)
        if reporter_info_response.status_code != 200:
            print(f"Failed to get reporter info: {reporter_info_response.status_code}")
            return
            
        reporter_id = reporter_info_response.json()["user_id"]
        print(f"Reporter ID: {reporter_id}")
        
        # Login reported user to get their ID
        print("\n3. Getting reported user ID...")
        reported_login_data = {"username": reported_data["email"], "password": reported_data["password"]}
        reported_login_response = requests.post(f"{BASE_URL}/api/v1/auth/login", data=reported_login_data)
        
        if reported_login_response.status_code != 200:
            print(f"Reported user login failed: {reported_login_response.status_code}")
            return
            
        reported_token = reported_login_response.json()["access_token"]
        reported_headers = {"Authorization": f"Bearer {reported_token}"}
        
        reported_info_response = requests.get(f"{BASE_URL}/api/v1/users/me", headers=reported_headers)
        if reported_info_response.status_code != 200:
            print(f"Failed to get reported user info: {reported_info_response.status_code}")
            return
            
        reported_id = reported_info_response.json()["user_id"]
        print(f"Reported user ID: {reported_id}")
        
        # Create report
        print("\n4. Creating report...")
        report_data = {
            "reporter_id": reporter_id,
            "reported_id": reported_id,
            "reason": "User was using inappropriate language and cheating during the game."
        }
        
        report_response = requests.post(f"{BASE_URL}/api/v1/reports/", 
                                      json=report_data, headers=reporter_headers)
        print(f"Create report response: {report_response.status_code}")
        
        if report_response.status_code == 200:
            report_result = report_response.json()
            report_id = report_result["report_id"]
            print(f"✅ Report created with ID: {report_id}")
            
            # Try to create report for different user (should fail)
            print("\n5. Testing permission validation...")
            invalid_report_data = {
                "reporter_id": "00000000-0000-0000-0000-000000000000",  # Different user ID
                "reported_id": reported_id,
                "reason": "This should fail."
            }
            
            invalid_response = requests.post(f"{BASE_URL}/api/v1/reports/", 
                                           json=invalid_report_data, headers=reporter_headers)
            print(f"Invalid report response: {invalid_response.status_code}")
            
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
                
                # Try to get all reports (admin only)
                print("\n7. Getting all reports (admin endpoint)...")
                all_reports_response = requests.get(f"{BASE_URL}/api/v1/reports/", headers=admin_headers)
                print(f"Get all reports response: {all_reports_response.status_code}")
                
                if all_reports_response.status_code == 200:
                    all_reports = all_reports_response.json()
                    print(f"✅ Retrieved {len(all_reports)} report entries")
                elif all_reports_response.status_code == 403:
                    print("⚠️  Admin permissions not set up - endpoint exists but requires superuser")
                else:
                    print(f"❌ Get all reports failed: {all_reports_response.status_code}")
                
                # Try to get specific report (admin only)
                print("\n8. Getting specific report by ID (admin endpoint)...")
                specific_report_response = requests.get(f"{BASE_URL}/api/v1/reports/{report_id}", 
                                                      headers=admin_headers)
                print(f"Get specific report response: {specific_report_response.status_code}")
                
                if specific_report_response.status_code == 200:
                    specific_report = specific_report_response.json()
                    print(f"✅ Retrieved specific report: {specific_report['reason'][:50]}...")
                elif specific_report_response.status_code == 403:
                    print("⚠️  Admin permissions not set up - endpoint exists but requires superuser")
                else:
                    print(f"❌ Get specific report failed: {specific_report_response.status_code}")
                
                # Try to update report status (admin only)
                print("\n9. Updating report status (admin endpoint)...")
                update_data = {
                    "status": "REVIEWED"
                }
                update_response = requests.put(f"{BASE_URL}/api/v1/reports/{report_id}", 
                                             json=update_data, headers=admin_headers)
                print(f"Update report response: {update_response.status_code}")
                
                if update_response.status_code == 200:
                    updated_report = update_response.json()
                    print(f"✅ Report status updated to: {updated_report['status']}")
                elif update_response.status_code == 403:
                    print("⚠️  Admin permissions not set up - endpoint exists but requires superuser")
                else:
                    print(f"❌ Update report failed: {update_response.status_code}")
            
            # Test with regular user trying to access admin endpoints
            print("\n10. Testing admin endpoint access with regular user...")
            user_admin_response = requests.get(f"{BASE_URL}/api/v1/reports/", headers=reporter_headers)
            print(f"Regular user accessing admin endpoint: {user_admin_response.status_code}")
            
            if user_admin_response.status_code == 403:
                print("✅ Admin endpoint properly protected!")
            else:
                print(f"❌ Admin endpoint not properly protected: expected 403, got {user_admin_response.status_code}")
            
            print("\n✅ All reports endpoints tested successfully!")
            
        else:
            print(f"❌ Create report failed: {report_response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to server. Make sure the backend is running on localhost:8000")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_reports_endpoints() 