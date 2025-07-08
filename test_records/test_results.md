# Baghchal Royale API Test Results

## Test Environment
- **Date:** 2025-07-07
- **Backend URL:** http://localhost:8000/api/v1

---

## Test Cases

### 1. Health Check
- **Endpoint:** `/health`
- **Method:** `GET`
- **Status:** `PASSED`
- **Response:** `{"status": "ok"}`

### 2. User Registration & Login
- **Endpoint:** `/auth/register`, `/auth/login`
- **Method:** `POST`
- **Status:** `PASSED`
- **Details:**
    - **TestUser1:**
        - **Registration:** Successful
        - **Login:** Successful
        - **Access Token:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NTI1NzE5NzUsInN1YiI6ImI0OTRlZDUwLWU1ZGEtNDRhZS1hNWZhLTViYzc2NWE3ZTQ3NSJ9.43iMV9_gwcJBoeIeDyPoH5r0mKVw1cKz2GSRN1vAOZ0`
    - **TestUser2:**
        - **Registration:** Successful
        - **Login:** Successful
        - **Access Token:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NTI1NzE5NzksInN1YiI6ImNhNzQ2YjE2LWVmZDUtNDVmMC1hMDFkLTVhYjNiMThlMjI3NCJ9.jD9cGNU_Gq0oevF-530Dnwfi19m3CIMbYyWcAbqLx34`
---