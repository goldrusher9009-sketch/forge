# VIVA API Reference

Base URL: `https://api.viva.app`  
Auth: `Authorization: Bearer <jwt>`  
All responses: `Content-Type: application/json`

---

## Auth Headers (injected by gateway)
| Header | Description |
|--------|-------------|
| `X-User-Id` | Authenticated user UUID |
| `X-V-Score` | Current V-Score (float) |
| `X-V-Tier` | Current tier string |

---

## V-Score

### GET /v1/vscore/score/:userId
Returns full V-Score + tier + ring breakdown.  
Cached 60 seconds.

```json
{
  "userId": "uuid",
  "score": 547.3,
  "tier": "stable",
  "rings": {
    "social": 72.1,
    "wealth": 61.4,
    "activity": 58.0,
    "sleep": 83.2,
    "nutrition": 55.7
  },
  "lastUpdated": "2026-06-08T10:00:00Z"
}
```

### GET /v1/vscore/score/:userId/rings
5-ring breakdown only.

### POST /v1/vscore/score/:userId/event
Push score event (action completed).
```json
{ "type": "social.post", "metadata": {} }
```

---

## Social Feed

### GET /v1/social/feed
```
?cursor=<cursor>   pagination cursor
```
```json
{
  "posts": [{ "id": "uuid", "creator": {...}, "videoUrl": "...", "likes": 0 }],
  "cursor": "next-cursor"
}
```

### POST /v1/social/feed/upload
`multipart/form-data` — uploads video, pins to IPFS.

### POST /v1/social/posts/:id/like
Toggle like.

### POST /v1/social/posts/:id/attention
Claim attention reward (called after 100% watch time).
```json
{ "earnedViva": 0.12, "txHash": "0x..." }
```

### POST /v1/social/posts/:id/mint
Mint post as NFT on Base L2.
```json
{ "contractAddress": "0x...", "tokenId": "42" }
```

### POST /v1/social/posts/:id/ad-slot
Open ad slot for advertisers.

---

## Messenger

### GET /v1/messenger/conversations
List user conversations.

### POST /v1/messenger/conversations
Create new conversation.
```json
{ "participantIds": ["uuid"], "type": "direct" }
```

### GET /v1/messenger/conversations/:id/messages
```
?limit=50&before=<msgId>
```

### POST /v1/messenger/conversations/:id/messages
Send message.
```json
{ "type": "text", "content": "hey" }
```

### WS /v1/messenger/ws/:conversationId
WebSocket real-time messages.  
Frames: `{ "type": "message", "data": {...} }`

### POST /v1/messenger/conversations/:id/tip
Send $VIVA tip in chat.
```json
{ "amount": 5.0 }
```

---

## Wallet / Finance

### GET /v1/wallet/balance
```json
{ "vivaBalance": 142.5, "earnedToday": 3.2, "walletAddress": "0x..." }
```

### GET /v1/wallet/transactions
```
?limit=20&cursor=<cursor>
```

### POST /v1/wallet/send
```json
{ "toAddress": "0x...", "amount": 10.0 }
```

### GET /v1/wallet/earn/today
```json
{ "total": 3.2, "breakdown": { "attention": 1.1, "twin": 2.1 } }
```

### GET /v1/wallet/youtoken/price/:creatorId
Current bonding curve price.

### POST /v1/wallet/youtoken/buy/:creatorId
```json
{ "vivaAmount": 50.0 }
```
Returns tokens received + new price.

### POST /v1/wallet/youtoken/sell/:creatorId
```json
{ "tokenAmount": 100 }
```

---

## AI Twin

### GET /v1/twin/tasks
List user tasks (pending + history).

### POST /v1/twin/tasks/trigger
```json
{ "domain": "commerce", "context": {} }
```

### POST /v1/twin/tasks/:id/approve
Approve pending task (semi-auto mode).

### POST /v1/twin/tasks/:id/reject
Reject task.

### PUT /v1/twin/autonomy
```json
{ "level": "semi-auto" }
```

---

## Health

### POST /v1/health/sleep
```json
{ "date": "2026-06-08", "durationMinutes": 450, "quality": 0.82, "zkProof": "<iden3-proof>" }
```

### POST /v1/health/activity
```json
{ "date": "2026-06-08", "steps": 8500, "activeMinutes": 45, "caloriesBurned": 320, "zkProof": "..." }
```

### POST /v1/health/nutrition
```json
{ "date": "2026-06-08", "calories": 1900, "proteinGrams": 80, "carbsGrams": 200, "fatGrams": 60, "zkProof": "..." }
```

### GET /v1/health/summary
Today's ring scores (sleep/activity/nutrition 0-100).

---

## Dating

### GET /v1/dating/discover
Discover profiles (V-Score gated).
```
?lat=40.7&lon=-74.0&maxKm=50
```

### POST /v1/dating/swipe/like/:userId
Like a profile.

### POST /v1/dating/swipe/superlike/:userId
SuperLike (limited per day).

### GET /v1/dating/matches
List mutual matches with conversation IDs.

---

## Rooms

### GET /v1/rooms
List live rooms.

### POST /v1/rooms
Create room.
```json
{ "title": "Web3 Alpha", "stakeGate": 0, "vscoreGate": 0, "isPrivate": false }
```

### POST /v1/rooms/:id/join
Join room.

### GET /v1/rooms/:id/token
Get LiveKit JWT for RN SDK connection.

### POST /v1/rooms/:id/raise-hand
Request speaker slot.

### POST /v1/rooms/:id/speakers/:userId/promote
Promote listener to speaker (host only).

---

## Predictions

### GET /v1/predictions/markets
List open markets.

### POST /v1/predictions/markets
```json
{ "title": "BTC > $100k by Dec?", "outcomeA": "Yes", "outcomeB": "No", "resolveAt": "2026-12-31T00:00:00Z" }
```

### POST /v1/predictions/markets/:id/bet
```json
{ "outcome": "a", "amount": 50.0 }
```

### POST /v1/predictions/markets/:id/claim
Claim winnings after resolution.

---

## Notifications

### POST /v1/notifications/device-token
Register push token.
```json
{ "token": "fcm-token", "platform": "android", "userId": "uuid" }
```

### GET /v1/notifications/inbox
List in-app notifications.

### PUT /v1/notifications/preferences
```json
{ "matches": true, "earn": true, "rooms": false, "marketing": false }
```

---

## Error Format
```json
{
  "error": "string",
  "code": "VSCORE_TOO_LOW",
  "details": {}
}
```

### Common Error Codes
| Code | HTTP | Meaning |
|------|------|---------|
| `UNAUTHORIZED` | 401 | Missing/invalid JWT |
| `VSCORE_TOO_LOW` | 403 | Feature requires higher V-Score tier |
| `RATE_LIMITED` | 429 | Too many requests |
| `NOT_FOUND` | 404 | Resource not found |
| `INSUFFICIENT_BALANCE` | 400 | Not enough $VIVA |
