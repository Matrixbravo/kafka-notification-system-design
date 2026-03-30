# Kafka Notification System (End-to-End)

A real-time notification system built using:

- Python Producer
- Apache Kafka
- Node.js Backend (Kafka Consumer + API + Socket.IO)
- SQLite Database
- React Frontend

This project demonstrates event-driven architecture, real-time updates, offline persistence, and deduplication (idempotency).

---

## Architecture Overview

```
Python Producer -> Kafka -> Node Consumer -> SQLite DB -> React UI
                                    -> Socket.IO (Real-time)
```

---

## Core Concepts Covered

- Event-driven system (Producer -> Broker -> Consumer)
- Real-time notifications (Socket.IO)
- Offline persistence (SQLite)
- Deduplication (idempotency)
- Read / Unread state management

---

## Components Explained

### Python Producer

- Sends notification events to Kafka topic: `notifications`

Example:

```json
{
  "eventId": "evt_2001",
  "userId": "user123",
  "type": "promo",
  "title": "Special Offer",
  "message": "You got 20% discount today."
}
```

---

### Kafka

- Message broker
- Stores events temporarily
- Decouples producer and consumer

---

### Node Backend

#### Kafka Consumer

- Reads messages from Kafka
- Processes events
- Stores notifications in SQLite

#### API Server

- GET /notifications/:userId
- GET /notifications/:userId/unread-count
- POST /notifications/:id/read

#### Socket.IO

- Sends real-time updates to frontend

---

### SQLite Database

| Field     | Description             |
|-----------|-------------------------|
| id        | Primary key             |
| event_id  | Unique event identifier |
| user_id   | Target user             |
| title     | Notification title      |
| message   | Notification content    |
| is_read   | 0 (unread), 1 (read)    |

---

### React Frontend

- Fetches notifications via API
- Receives live updates via Socket.IO

---

## System Flows

### Case 1: First Notification

1. Python sends event  
2. Kafka stores it  
3. Node consumes it  
4. Data stored in DB  
5. Frontend displays it  

Result: Notification appears

---

### Case 2: Duplicate Notification

Same eventId sent again:

```
evt_1001
```

Backend skips:

```
Duplicate notification skipped: evt_1001 user123
```

Result: No duplicate shown

---

### Case 3: New Notification

New eventId:

```
evt_2001
```

Result: Stored and shown as new notification

---

### Case 4: Mark as Read

API call:

```
POST /notifications/:id/read
```

DB update:

```sql
UPDATE notifications SET is_read = 1;
```

Result:
- Notification marked as read  
- Unread count updated  
- No new notification created  

---

### Case 5: Offline Support

- Notifications are stored in DB
- User can view them later

Result: No data loss

---

### Case 6: Page Refresh

- React fetches notifications from DB

Result: Notifications persist

---

## Multi-User Support

Example:

```json
{
  "eventId": "evt_3001",
  "userId": "user456"
}
```

Behavior:

- Stored for user456
- Not visible to user123

To test:

```js
const userId = "user456";
```

Result: user456 notifications appear

---

### Duplicate notification skipped

Cause: Same eventId used again

This is expected behavior

---

## How to Run

### Start Kafka

```
docker compose up -d
```

### Start Backend

```
cd backend
npm run dev
```

### Start Frontend

```
cd frontend
npm run dev
```

### Send Notifications

```
python send_notification.py
```

---

## Key Learnings

- Kafka Producer-Consumer architecture
- Idempotent event processing
- Real-time communication using WebSockets
- Offline-first system design
- Multi-user notification handling

---

## Summary

This system uses Kafka to decouple producers and consumers, stores notifications reliably in a database, prevents duplicates using event IDs, and delivers real-time updates while supporting offline users.