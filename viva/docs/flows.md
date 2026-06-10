# VIVA Feature Flows

## 1. User Onboarding Flow

```
App Launch
    │
    ▼
World ID Verification (proof-of-human)
    │
    ▼
Phone/Email (optional for recovery)
    │
    ▼
Dynamic.xyz Embedded Wallet Created (no seed phrase)
    │
    ▼
ZK-SBT Issued on Base L2 (ZKSBT.sol)
    │
    ▼
V-Score initialized → tier=seed, score=0
    │
    ▼
Referral code check → both sides receive $5 VIVA
    │
    ▼
HomeCanvas (5-ring dashboard shown)
    │
    ▼
Twin onboarding: set autonomy level
```

## 2. Feed / Attention Reward Flow

```
User opens Feed tab
    │
    ▼
GET /v1/social/feed?cursor=... (paginated)
    │
    ▼
FeedItem renders (expo-av video, auto-plays)
    │
    ▼
AttentionRing tracks watch time (0→100%)
    │
    ▼
On 100%:
    POST /v1/social/posts/{id}/attention
        │
        ▼
    backend: log attention event
    backend: call AdMarketplace.distributeAttention (if ad active)
        │
        ▼
    $VIVA credited to viewer wallet
    V-Score event pushed → social ring +
```

## 3. Ad Slot Flow

```
Creator: POST /v1/social/posts/{id}/ad-slot
    │ (opens slot on-chain: AdMarketplace.openSlot)
    ▼
Advertiser: sees open slot in marketplace
    │
    ▼
Advertiser: POST /v1/marketplace/ads/slots/{postId}
    │ (AdMarketplace.placeBid → $VIVA locked in contract)
    ▼
Creator: push notification "New ad bid: X $VIVA"
    │
    ▼
Creator: POST /ads/slots/{postId}/approve OR /reject
    │
    ├─ Approve:
    │    AdMarketplace.approveAd
    │    Creator receives 70%
    │    Treasury receives 20%
    │    10% → attention pool for viewers
    │
    └─ Reject:
         Bid refunded to advertiser
```

## 4. AI Twin Task Flow

```
Trigger (user manual | scheduled | semi-auto)
    │
    ▼
POST /v1/twin/tasks/trigger {domain: "commerce"}
    │
    ▼
MetaAgent: query user preferences (vector DB)
    │
    ▼
TaskAgent: plan + execute domain action
    │
    ├─ autonomy=suggest:    present plan, wait for user approve
    ├─ autonomy=semi-auto:  execute + notify result
    └─ autonomy=full-auto:  execute silently, summarize daily
    │
    ▼
Task result → earn $VIVA
    │
    ▼
MetaAgent: store feedback → improve next task
    │
    ▼
PUT /v1/wallet/earn/log {source: "twin_task", amount: X}
    │
    ▼
V-Score event: wealth ring +
```

## 5. Dating Match Flow

```
User opens Dating tab
    │
    ▼
GET /v1/dating/discover (V-Score gated: Stable+ for distance filters)
    │
    ▼
ML Matching Engine:
    - pgvector cosine similarity on user embeddings
    - V-Score compatibility weight
    - Location radius filter
    │
    ▼
Profile card stack rendered
    │
    ▼
Swipe Like / Pass / SuperLike
    POST /v1/dating/swipe/like/{userId}
    │
    ▼
Mutual like detected?
    │
    ├─ No:  store swipe, continue
    └─ Yes: create match record
            create conversation (messenger)
            push notification to both
            $VIVA earn event → dating match reward
            SBT twin: learning feedback (mutual interest signal)
```

## 6. YouToken Buy Flow

```
User views creator profile
    │
    ▼
GET /v1/wallet/youtoken/price/{creatorId}
    (returns current bonding curve price)
    │
    ▼
User taps "Buy $CREATOR"
    │
    ▼
POST /v1/wallet/youtoken/buy/{creatorId} {amount: X VIVA}
    │
    ▼
Backend: YouToken.buy(vivaAmount) on-chain
    - 5% → creator
    - 2% → treasury
    - 93% → bonding curve reserve
    │
    ▼
User receives YouTokens
Price increases
Creator earns fee instantly
```

## 7. Health ZK Flow

```
Device (React Native)
    │
    ▼
HealthKit / Google Fit (on-device, raw data NEVER leaves)
    │
    ▼
ZK-proof generated on device (iden3 circuit)
    Proves: "sleep was 7-9 hours" WITHOUT revealing exact value
    │
    ▼
POST /v1/health/sleep {date, durationMinutes, quality, zkProof}
    │
    ▼
Backend: verify ZK proof signature
Compute sleep score 0-100
Store: score + zk_proof_hash ONLY (no raw data)
    │
    ▼
Push score event → V-Score service
Sleep ring updated on HomeCanvas
```

## 8. Prediction Market Flow

```
Creator: POST /v1/predictions/markets
    {title, outcomeA, outcomeB, resolveAt}
    │
    ▼
PredictionMarket.createMarket on-chain
    │
    ▼
Users: POST /v1/predictions/markets/{id}/bet
    {outcome: "a", amount: 50 VIVA}
    PredictionMarket.bet → $VIVA locked in contract
    │
    ▼
At resolveAt:
    VIVA oracle calls PredictionMarket.resolve(marketId, winner)
    │
    ▼
Winners: POST /v1/predictions/markets/{id}/claim
    PredictionMarket.claimWinnings
    - 2% platform, 1% creator, rest to winners proportional to stake
```

## 9. Audio Room Flow

```
Host: POST /v1/rooms {title, stakeGate: 10 VIVA}
    │
    ▼
Backend: create LiveKit room, generate room record
    │
    ▼
Listener joins: POST /v1/rooms/{id}/join
    - Check V-Score gate
    - Check stake gate (if set)
    │
    ▼
GET /v1/rooms/{id}/token → LiveKit JWT
    │
    ▼
React Native LiveKit SDK connects (WebRTC)
    │
    ▼
Listener raises hand: POST /v1/rooms/{id}/raise-hand
Host promotes: POST /v1/rooms/{id}/speakers/{userId}/promote
    │
    ▼
Host earns $VIVA per listener-minute
Recording optional (host opt-in)
```
