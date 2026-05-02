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

# Stage 3

## Slow Query Analysis

### Original Query
```sql
SELECT * FROM notifications
WHERE studentID = 1042 AND isRead = false
ORDER BY createdAt DESC;
```

### Why is it slow?
- No indexes on studentID, isRead, or createdAt
- SELECT * fetches all columns unnecessarily
- At 50,000 students x 5,000,000 notifications = full table scan every time

### Fix — Add Composite Index
```sql
CREATE INDEX idx_notifications_student_unread 
ON notifications(student_id, is_read, created_at DESC);
```

### Should we index every column?
**No.** Indexing every column is bad because:
- Every INSERT/UPDATE becomes slower (indexes must update too)
- More storage used
- Only index columns used in WHERE, ORDER BY, JOIN

### Optimized Query
```sql
SELECT id, type, message, created_at 
FROM notifications
WHERE student_id = 1042 AND is_read = false
ORDER BY created_at DESC;
```

### Find students with Placement notification in last 7 days
```sql
SELECT DISTINCT student_id 
FROM notifications
WHERE type = 'Placement'
AND created_at >= NOW() - INTERVAL '7 days';
```

# Stage 4

## Caching Strategy for Notifications

### Problem
Notifications fetched on every page load → DB overwhelmed.

### Solution: Redis Cache

**Strategy:**
- On first fetch → get from DB, store in Redis with TTL of 60 seconds
- On next fetch → return from Redis directly, skip DB
- On new notification / mark as read → invalidate that student's cache

### Tradeoffs

| Strategy | Pro | Con |
|----------|-----|-----|
| Redis TTL cache | Fast reads | Slight stale data |
| No cache | Always fresh | DB dies under load |
| Infinite cache | Fastest | Stale forever |

### Cache Key Design
notifications:student:{student_id}:unread
### Pseudocode

GET /api/notifications:
key = "notifications:student:{id}:unread"
if Redis.get(key) exists → return it
else → fetch from DB → Redis.set(key, data, TTL=60) → return
PATCH /api/notifications/:id/read:
update DB
Redis.delete(key) ← invalidate cache

# Stage 5

## Bulk Notification Redesign

### Shortcomings of original pseudocode
- Sequential loop → 50,000 students notified one by one = very slow
- If send_email fails midway, no retry mechanism
- DB save and email in sequence → if email fails, DB already saved (inconsistency)

### Redesigned Pseudocode
async function notify_all(student_ids, message):
results = await Promise.allSettled(
student_ids.map(async (id) =>
await Promise.all([
send_email(id, message),   // parallel
save_to_db(id, message),   // parallel
push_to_app(id, message)   // parallel
])
)
)
log failed students for retry

### Should DB save and email happen together?
No — they should be independent. If email fails, DB save should still succeed so the notification is not lost. Use a message queue (e.g. BullMQ/Redis) for email retries separately.
