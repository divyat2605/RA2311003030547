# Stage 1

## REST API Design for Campus Notification System

### Core Actions
- Fetch all notifications for a logged-in user
- Mark a notification as read
- Mark all notifications as read
- Real-time notification delivery

---

### Endpoints

#### GET /api/notifications
Fetch all notifications for the logged-in user.

**Headers:**
Authorization: Bearer <token>

**Response:**
{
  "notifications": [
    {
      "ID": "uuid",
      "Type": "Placement | Result | Event",
      "Message": "string",
      "Timestamp": "ISO string",
      "isRead": false
    }
  ]
}

#### PATCH /api/notifications/:id/read
Mark a single notification as read.

**Response:**
{ "success": true }

#### PATCH /api/notifications/read-all
Mark all notifications as read.

**Response:**
{ "success": true }

---

### Real-time Mechanism
Use **WebSockets** (Socket.io).
- Server emits `new_notification` event to user's room
- Client listens and updates UI instantly