# System Test Cases for Baghchal Royale

This document outlines the end-to-end system test cases for the Baghchal Royale application.

---

### Full Multiplayer Game Cycle

| ID | Description | Expected Result | Actual Result | Remark |
|---|---|---|---|---|
| 1 | Two users register, befriend each other, play a full game (User A wins), and check their profiles. | Game completes. User A's wins/ELO increase. User B's losses/ELO decrease. | Success. Alice's ELO changed from 1200 to 1215. Bob's from 1200 to 1185. | Pass |

---

### Player vs. AI Cycle

| ID | Description | Expected Result | Actual Result | Remark |
|---|---|---|---|---|
| 1 | A registered user plays and wins a game against the AI and checks for updated stats. | Game completes. Profile shows +1 win, increased XP, and potential level up. | Success. User gained 50 XP and leveled up from 1 to 2. | Pass | 