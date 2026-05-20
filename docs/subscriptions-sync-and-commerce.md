# IR Studio Live: Subscriptions, Sync, and Commerce

## Subscription tiers

### Free
- Storage: local only
- Price: free
- Active events: 1
- Cloud sync: no
- Guest web live wall: no
- Guest sales: no
- Platform fee: 0%

### Starter
- Storage: 50 GB
- Price: $4.99/month or $49/year
- Cloud sync: yes
- Guest web live wall: yes
- Guest sales: yes
- Platform fee: 5%

### Pro
- Storage: 200 GB
- Price: $9.99/month or $99/year
- Cloud sync: yes
- Guest web live wall: yes
- Guest sales: yes
- Platform fee: 3%

### Studio
- Storage: 1 TB
- Price: $24.99/month or $249/year
- Cloud sync: yes
- Guest web live wall: yes
- Guest sales: yes
- Platform fee: 0%

## Core product rule

Every capture saves to the device first. Cloud plans add backup, guest delivery, and sales.

## Sync behavior

- Capture priority: local-first
- Cloud behavior: background-sync
- Offline fallback: local album and cache
- Guest web dependency: cloud required
- Quota behavior: local capture continues, cloud upload blocked

### Sync states

- `local_only`
  - Saved on device only
- `pending_upload`
  - Saved locally and waiting to sync
- `synced`
  - Saved locally and synced to cloud
- `offline_fallback`
  - Using local album because cloud is offline
- `quota_blocked`
  - Saved locally, but cloud storage is full

## Commerce model

The launch model is:

- digital photo downloads
- video clip downloads
- self-fulfilled print orders

### Self-fulfilled prints

Guests can order print sizes online. The photographer receives:

- paid order
- selected files
- selected print sizes
- customer information

The photographer fulfills prints through their own lab or print provider.

## Platform fee policy

Platform fee applies only to guest purchases made through the web live wall:

- digital photo downloads
- video clip downloads
- print orders

Payment processor fees are separate.

## Store product IDs

### App Store

- `ir_starter_50_monthly`
- `ir_starter_50_yearly`
- `ir_pro_200_monthly`
- `ir_pro_200_yearly`
- `ir_studio_1000_monthly`
- `ir_studio_1000_yearly`

### Google Play

- `ir_starter_50_monthly`
- `ir_starter_50_yearly`
- `ir_pro_200_monthly`
- `ir_pro_200_yearly`
- `ir_studio_1000_monthly`
- `ir_studio_1000_yearly`

## Stripe product setup

Create products or product families for:

- Digital Download
- Video Clip Download
- Self-Fulfilled Print Order

Suggested metadata on orders:

- `eventId`
- `guestId`
- `sellerPlan`
- `platformFeePercent`
- `platformFeeAmount`
- `printSizes`
- `collection`

## Print settings photographers should control

- 4x6
- 5x7
- 8x10
- 11x14
- 16x20
- Photo Set
- digital download price
- video clip price
- enable/disable by event

## External console checklist

### Vercel

- `NEXT_PUBLIC_LIVE_BASE_URL`
- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET`

### Cloudflare

- R2 bucket: `irstudiolive-media`

### Stripe

- business profile
- payout account
- products for digital, video, self-fulfilled print orders

### App Store Connect

- create subscription products listed above

### Google Play Console

- create subscription products listed above
