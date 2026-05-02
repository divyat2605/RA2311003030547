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
# Stage 2

## Database Design

### Recommended DB: PostgreSQL
- Structured data with clear relationships
- Strong support for indexes and query optimization
- ENUM support for notification types

### Schema

```sql
CREATE TYPE notification_type AS ENUM ('Placement', 'Result', 'Event');

CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id),
  type notification_type NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Queries

-- Fetch unread notifications for a student
SELECT * FROM notifications
WHERE student_id = $1 AND is_read = false
ORDER BY created_at DESC;

-- Mark one as read
UPDATE notifications SET is_read = true WHERE id = $1;

-- Mark all as read
UPDATE notifications SET is_read = true WHERE student_id = $1;

### Scaling Problems at High Volume
- Table grows huge → query slows down
- Solution: Index on (student_id, is_read, created_at)
- Archive old notifications to separate table
- Partition table by created_at (monthly)