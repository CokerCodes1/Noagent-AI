# Backend Integration Guide: Push Notifications

This guide shows how to set up the Node.js/Express backend to support PWA push notifications.

## Prerequisites

```bash
npm install web-push dotenv
```

## Environment Setup

Add to `.env`:

```env
# Generate using: npx web-push generate-vapid-keys
VAPID_PUBLIC_KEY=BKxxxxxxxxxxxx...
VAPID_PRIVATE_KEY=xxxxxxxxxxxxxx...
VAPID_SUBJECT=mailto:support@noagentnaija.com

# Database connection (existing)
DB_HOST=localhost
DB_USER=root
DB_PASS=password
DB_NAME=noagentnaija

# Frontend URL for CORS
FRONTEND_URL=http://localhost:5173
```

Generate VAPID keys once:

```bash
npx web-push generate-vapid-keys
```

Copy output to `.env` file.

## Database Schema

Create subscriptions table:

```sql
CREATE TABLE push_subscriptions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  endpoint VARCHAR(2000) NOT NULL UNIQUE,
  p256dh VARCHAR(500) NOT NULL,
  auth VARCHAR(500) NOT NULL,
  role ENUM('landlord', 'renter', 'technician', 'admin') NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX (user_id, role),
  INDEX (enabled)
);
```

## Backend Implementation

### 1. Setup Web Push

File: `config/webpush.js`

```javascript
const webpush = require('web-push');

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

module.exports = webpush;
```

### 2. Notification Controller

File: `controllers/notificationController.js`

```javascript
const webpush = require('web-push');
const db = require('../config/db');

// Subscribe to push notifications
exports.subscribe = async (req, res) => {
  try {
    const { subscription, role } = req.body;
    const userId = req.user.id; // From auth middleware

    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ error: 'Invalid subscription' });
    }

    // Check if already subscribed
    const existing = await db.query(
      'SELECT id FROM push_subscriptions WHERE user_id = ? AND endpoint = ?',
      [userId, subscription.endpoint]
    );

    if (existing.length > 0) {
      return res.json({ success: true, message: 'Already subscribed' });
    }

    // Store subscription
    await db.query(
      'INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, role, enabled) VALUES (?, ?, ?, ?, ?, TRUE)',
      [
        userId,
        subscription.endpoint,
        subscription.keys.p256dh,
        subscription.keys.auth,
        role
      ]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Subscribe error:', error);
    res.status(500).json({ error: 'Subscription failed' });
  }
};

// Unsubscribe from push notifications
exports.unsubscribe = async (req, res) => {
  try {
    const { endpoint } = req.body;
    const userId = req.user.id;

    await db.query(
      'DELETE FROM push_subscriptions WHERE user_id = ? AND endpoint = ?',
      [userId, endpoint]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Unsubscribe error:', error);
    res.status(500).json({ error: 'Unsubscribe failed' });
  }
};

// Enable notifications for a role
exports.enableRole = async (req, res) => {
  try {
    const { role } = req.params;
    const userId = req.user.id;

    // Check valid role
    const validRoles = ['landlord', 'renter', 'technician', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Enable all subscriptions for this role
    await db.query(
      'UPDATE push_subscriptions SET enabled = TRUE WHERE user_id = ? AND role = ?',
      [userId, role]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Enable error:', error);
    res.status(500).json({ error: 'Enable failed' });
  }
};

// Disable notifications for a role
exports.disableRole = async (req, res) => {
  try {
    const { role } = req.params;
    const userId = req.user.id;

    await db.query(
      'UPDATE push_subscriptions SET enabled = FALSE WHERE user_id = ? AND role = ?',
      [userId, role]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Disable error:', error);
    res.status(500).json({ error: 'Disable failed' });
  }
};

// Get user's subscriptions
exports.getSubscriptions = async (req, res) => {
  try {
    const userId = req.user.id;

    const subscriptions = await db.query(
      'SELECT role, enabled FROM push_subscriptions WHERE user_id = ? GROUP BY role',
      [userId]
    );

    res.json({ subscriptions });
  } catch (error) {
    console.error('Get subscriptions error:', error);
    res.status(500).json({ error: 'Failed to get subscriptions' });
  }
};

// Send push notification to user
exports.sendToUser = async (req, res) => {
  try {
    const { userId, title, body, data = {} } = req.body;

    const subscriptions = await db.query(
      'SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = ? AND enabled = TRUE',
      [userId]
    );

    if (subscriptions.length === 0) {
      return res.json({ success: false, message: 'No active subscriptions' });
    }

    const payload = JSON.stringify({
      title,
      body,
      icon: '/icon-192.png',
      badge: '/icon-96.png',
      tag: `notification-${Date.now()}`,
      data
    });

    const results = await Promise.allSettled(
      subscriptions.map(sub =>
        webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth }
          },
          payload
        )
      )
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    // Remove failed subscriptions (likely unsubscribed)
    for (let i = 0; i < results.length; i++) {
      if (results[i].status === 'rejected') {
        const reason = results[i].reason;
        if (reason.statusCode === 410) { // Gone
          await db.query(
            'DELETE FROM push_subscriptions WHERE endpoint = ?',
            [subscriptions[i].endpoint]
          );
        }
      }
    }

    res.json({ success: true, sent: successful, failed });
  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({ error: 'Failed to send notification' });
  }
};

// Send push notification to all users with a role
exports.sendToRole = async (req, res) => {
  try {
    const { role, title, body, data = {} } = req.body;

    const subscriptions = await db.query(
      'SELECT DISTINCT endpoint, p256dh, auth FROM push_subscriptions WHERE role = ? AND enabled = TRUE',
      [role]
    );

    if (subscriptions.length === 0) {
      return res.json({ success: false, message: 'No subscribed users in role' });
    }

    const payload = JSON.stringify({
      title,
      body,
      icon: '/icon-192.png',
      badge: '/icon-96.png',
      tag: `notification-${Date.now()}`,
      data
    });

    const results = await Promise.allSettled(
      subscriptions.map(sub =>
        webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth }
          },
          payload
        )
      )
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    res.json({ success: true, sent: successful, failed });
  } catch (error) {
    console.error('Send to role error:', error);
    res.status(500).json({ error: 'Failed to send notifications' });
  }
};
```

### 3. Notification Routes

File: `routes/notifications.js`

```javascript
const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const auth = require('../middleware/auth');

// Subscription management
router.post('/subscribe', auth, notificationController.subscribe);
router.post('/unsubscribe', auth, notificationController.unsubscribe);
router.post('/enable/:role', auth, notificationController.enableRole);
router.post('/disable/:role', auth, notificationController.disableRole);
router.get('/subscriptions', auth, notificationController.getSubscriptions);

// Sending notifications (admin only)
router.post('/send-user', auth, isAdmin, notificationController.sendToUser);
router.post('/send-role', auth, isAdmin, notificationController.sendToRole);

const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' });
  }
  next();
};

module.exports = router;
```

### 4. Register Routes in Server

File: `server.js`

```javascript
// ... existing imports

const notificationRoutes = require('./routes/notifications');

// ... existing middleware

app.use('/api/notifications', notificationRoutes);

// ... rest of server
```

## Sending Notifications

### From Admin Dashboard

File: `controllers/adminController.js`

```javascript
const db = require('../config/db');
const webpush = require('../config/webpush');

// Send notification to landlords about new maintenance request
exports.notifyLandlordsNewRequest = async (requestId, propertyId) => {
  try {
    const request = await db.query(
      'SELECT * FROM maintenance_requests WHERE id = ?',
      [requestId]
    );

    const property = await db.query(
      'SELECT * FROM properties WHERE id = ?',
      [propertyId]
    );

    const subscriptions = await db.query(
      'SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE role = "landlord" AND enabled = TRUE'
    );

    const payload = JSON.stringify({
      title: 'New Maintenance Request',
      body: `New request for ${property[0].name}`,
      icon: '/icon-192.png',
      badge: '/icon-96.png',
      tag: `maintenance-${requestId}`,
      data: {
        url: `/dashboard/properties/${propertyId}/requests`,
        requestId
      }
    });

    await Promise.allSettled(
      subscriptions.map(sub =>
        webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth }
          },
          payload
        )
      )
    );
  } catch (error) {
    console.error('Notify error:', error);
  }
};

// Notify tenant about rent reminder
exports.notifyTenantRentReminder = async (leaseId, daysUntilDue) => {
  try {
    const lease = await db.query(
      'SELECT user_id, amount FROM leases WHERE id = ?',
      [leaseId]
    );

    const subscriptions = await db.query(
      'SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = ? AND enabled = TRUE',
      [lease[0].user_id]
    );

    const payload = JSON.stringify({
      title: 'Rent Due Soon',
      body: `Rent of ₦${lease[0].amount} is due in ${daysUntilDue} days`,
      icon: '/icon-192.png',
      badge: '/icon-96.png',
      tag: 'rent-reminder',
      data: {
        url: '/dashboard/payments',
        leaseId
      }
    });

    await Promise.allSettled(
      subscriptions.map(sub =>
        webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth }
          },
          payload
        )
      )
    );
  } catch (error) {
    console.error('Rent reminder error:', error);
  }
};
```

## Testing Notifications

### Using cURL

```bash
# Generate auth token first (from login)
TOKEN="your_jwt_token_here"

# Subscribe
curl -X POST http://localhost:5003/api/notifications/subscribe \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "subscription": {
      "endpoint": "https://fcm.googleapis.com/...",
      "keys": {
        "p256dh": "...",
        "auth": "..."
      }
    },
    "role": "landlord"
  }'

# Send test notification
curl -X POST http://localhost:5003/api/notifications/send-user \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 123,
    "title": "Test Notification",
    "body": "This is a test",
    "data": { "url": "/" }
  }'
```

### Using JavaScript

```javascript
// Get subscription from client
const subscription = await navigator.serviceWorker.ready
  .then(r => r.pushManager.getSubscription());

// Send to backend
fetch('/api/notifications/send-user', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 123,
    title: 'Test',
    body: 'Test notification',
    subscription
  })
});
```

## Production Deployment

### Environment Variables

Set these on your hosting platform (Heroku, AWS, etc.):

```env
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:support@noagentnaija.com
```

### CORS Configuration

```javascript
const cors = require('cors');

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
```

## Troubleshooting

### Subscription fails with 403

- Check JWT token in auth middleware
- Verify `Authorization: Bearer $TOKEN` header

### Push sending fails with 410

- Subscription expired (user uninstalled app)
- Remove from database automatically (see code above)

### No endpoint validation

- Check browser console for subscription object
- Verify service worker is registered
- Check notification permission

## Monitoring

### Log push activities

```javascript
const fs = require('fs');

function logNotification(userId, title, status) {
  const log = `${new Date().toISOString()} - User ${userId}: ${title} - ${status}\n`;
  fs.appendFileSync('notifications.log', log);
}
```

### Check failed subscriptions

```javascript
const failedSubs = await db.query(
  'SELECT id, user_id, role FROM push_subscriptions WHERE updated_at < DATE_SUB(NOW(), INTERVAL 30 DAY)'
);

// Cleanup old inactive subscriptions
await db.query('DELETE FROM push_subscriptions WHERE updated_at < DATE_SUB(NOW(), INTERVAL 90 DAY)');
```

## Best Practices

1. **Always validate input** - Check subscription format
2. **Handle failures gracefully** - Remove invalid subscriptions
3. **Rate limit** - Prevent notification spam
4. **Batch sends** - Use Promise.allSettled for efficiency
5. **Test thoroughly** - Use multiple browsers and devices
6. **Monitor costs** - Web Push is usually free but track usage
7. **Privacy first** - Only send relevant notifications
8. **Respect preferences** - Allow users to disable by role

---

For more info: [Web Push Protocol](https://datatracker.ietf.org/doc/html/draft-thomson-webpush-protocol)
