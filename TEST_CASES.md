# Unit Test Cases for Baghchal Royale

This document outlines the unit test cases for various features of the Baghchal Royale application.

---

### User Registration

| ID | Description | Expected Result | Actual Result | Remark |
|---|---|---|---|---|
| 1 | Register a new user with valid, unique details. | User account is created successfully. API returns HTTP 201. | User account created. Received HTTP 201. | Pass |
| 2 | Attempt registration with an already registered email. | Registration fails. API returns an error message and HTTP 400. | Error: "Email already registered." Received HTTP 400. | Pass |

---

### User Login

| ID | Description | Expected Result | Actual Result | Remark |
|---|---|---|---|---|
| 1 | Log in with correct credentials. | User is authenticated successfully. A valid JWT is returned. | Login successful. JWT received. | Pass |
| 2 | Attempt to log in with an incorrect password. | Authentication fails. API returns an error message and HTTP 401. | Error: "Incorrect email or password." Received HTTP 401. | Pass |

---

### User Management

| ID | Description | Expected Result | Actual Result | Remark |
|---|---|---|---|---|
| 1 | Fetch another user's profile. | The correct user's profile data is displayed. | Profile for "Player Two" displayed correctly. | Pass |
| 2 | Update the current user's full name. | The user's name is updated in the database. | Name changed successfully. | Pass |

---

### Game Logic

| ID | Description | Expected Result | Actual Result | Remark |
|---|---|---|---|---|
| 1 | Start a new multiplayer game. | A new game session is created with a unique ID. | Game started. ID generated. | Pass |
| 2 | Make a valid move in an ongoing game. | The move is accepted and the game state updates for both players. | Move accepted. Board updated. | Pass |
| 3 | Attempt to make an invalid move. | The move is rejected and an error message is shown. | Error: "Invalid move." | Pass |
| 4 | Determine the winner after a final move. | The game status updates to "finished" and the winner is declared. | Game over screen shown, winner declared. | Pass |

---

### AI Engine

| ID | Description | Expected Result | Actual Result | Remark |
|---|---|---|---|---|
| 1 | AI generates a valid move as Tiger. | The AI (as Tiger) returns a valid, legal move in a timely manner. | AI made a valid move in <2s. | Pass |
| 2 | AI generates a valid move as Goat. | The AI (as Goat) returns a valid, legal move in a timely manner. | AI made a valid move in <2s. | Pass |

---

### Friendship

| ID | Description | Expected Result | Actual Result | Remark |
|---|---|---|---|---|
| 1 | Send a friend request to another user. | The request is sent and the recipient receives a notification. | Request sent. Notification received. | Pass |
| 2 | Accept a pending friend request. | The friendship status is updated to 'accepted' for both users. | Users are now friends. | Pass |

---

### Feedback & Reports

| ID | Description | Expected Result | Actual Result | Remark |
|---|---|---|---|---|
| 1 | Submit feedback through the feedback form. | The feedback is successfully stored in the database. | Failed to save. Received HTTP 500. | **Fail** |
| 2 | Report a user for inappropriate behavior. | The report is saved and flagged for admin review. | Report submitted. Flagged in admin panel. | Pass |

---

### WebSocket Service

| ID | Description | Expected Result | Actual Result | Remark |
|---|---|---|---|---|
| 1 | Establish a WebSocket connection at the start of a match. | A stable WebSocket connection is established for all clients. | Connection successful for both players. | Pass |
| 2 | Broadcast a move to all players in real-time. | The move is reflected on the opponent's screen instantly. | Move reflected in <500ms. | Pass |

---

### Admin Panel

| ID | Description | Expected Result | Actual Result | Remark |
|---|---|---|---|---|
| 1 | Admin logs in with admin credentials. | Admin is authenticated and redirected to the admin dashboard. | Login successful. Redirected to dashboard. | Pass |
| 2 | View all user-submitted reports. | A list of all reports with details is displayed. | All submitted reports are visible. | Pass |
| 3 | Take action on a report (e.g., ban user). | Admin can ban the reported user. The user's account is disabled. | User "UserC" banned successfully. Account disabled. | Pass |
| 4 | View a list of all registered users. | Admin can see a paginated list of all users. | User list loaded correctly. | Pass |
| 5 | View system statistics on the dashboard. | Dashboard shows key metrics (e.g., active users, games played). | Stats dashboard displays correct data. | Pass | 