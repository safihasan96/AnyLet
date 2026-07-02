# Backend Architecture (Database, Auth, and APIs)

## 1. Firebase Authentication & Identity Management

### The Email-Based Privilege Enforcement Model
AnyLet shifts away from relying purely on dynamic Firebase UIDs for high-privileged system tracking (Admin logs, Webhook execution identities, and operational overrides). Instead, the system treats **email addresses** as the immutable source of truth for administrative action.

**Why this matters:**
If a tenant deletes their account and re-registers, their UID changes. If an Admin UID is hardcoded in a configuration file, revoking or assigning new admins becomes a manual database patch. By keying off `@anylet.com` emails or an explicit whitelist, we guarantee auditability. The `/api/set-admin-claim.js` script verifies the user's email against an environment array before minting a custom JWT claim.

**Impact on Security Rules:**
```javascript
// Example firestore.rules snippet enforcing the JWT Custom Claim
match /kycSubmissions/{submissionId} {
  allow read: if request.auth != null && (request.auth.uid == resource.data.uid || request.auth.token.admin == true);
  allow update: if request.auth != null && request.auth.token.admin == true;
}
```

## 2. Firestore Database Schema

### `users` Collection
- **`uid`** (string): Matches Firebase Auth UID.
- **`email`** (string)
- **`role`** (string): System role (`user`, `admin`).
- **`userRole`** (string): UI preference (`tenant`, `owner`).
- **`onboardingStatus`** (string): e.g., `IN_PROGRESS`, `PENDING_VERIFICATION`, `completed`.
- **`referralCode`** (string): Unique 6-character code.
- **`verification`** (map):
  - `idDocumentUrl` (string): Cloudinary URL
  - `isKycApproved` (boolean)

### `properties` Collection
- **`ownerId`** (string): Foreign key to `users.uid`.
- **`title`** (string)
- **`rent`** (number): Monthly rent in BDT.
- **`securityDeposit`** (number): Escrow required in BDT.
- **`status`** (string): `available`, `rented`, `unlisted`.
- **`images`** (array): Array of Cloudinary URLs.

### `paymentIntents` Collection
Temporary records bridging the UI to the offline SMS webhook.
- **`referenceCode`** (string): e.g., `ANYLET-A1B2C3D4`
- **`expectedAmount`** (number): Calculated server-side (Rent + Fees).
- **`status`** (string): `pending`, `completed`, `expired`.
- **`bookingType`** (string): `deposit`, `subscription`, `listing`.

---

## 3. Serverless API Contracts (`api/`)

All API routes are protected by the `withMiddleware()` HOF which enforces rate limiting (30 req/min), body parsing limits, and JWT validation.

### `POST /api/create-payment-intent`
Initiates an escrow ledger intent. Must be called by an authenticated user.

- **Allowed Methods**: `POST`
- **Request Body**:
  ```json
  {
    "bookingType": "deposit",
    "propertyId": "prop_123xyz",
    "onsiteVerification": false,
    "months": 1
  }
  ```
- **Middleware Applied**: JWT Verification (`req.user`), Body constraints.
- **Logic Constraints**: The server ignores any client-provided `amount`. It queries the `properties` collection server-side to calculate `expectedAmount` based on the database's `securityDeposit` + `DEPOSIT_SERVICE_FEE` (99 BDT).
- **Success Response** (200 OK):
  ```json
  {
    "success": true,
    "id": "intent_789abc",
    "referenceCode": "ANYLET-XXXXXX",
    "expectedAmount": 15099
  }
  ```

### `POST /api/sms-webhook`
The secure ingestion point for mobile money confirmations (bKash, Nagad).

- **Allowed Methods**: `POST`
- **Request Body** (from Tasker/Forwarder app):
  ```json
  {
    "provider": "bkash",
    "smsText": "You have received Tk 15,099.00 from 017XXXXXX. Ref ANYLET-XXXXXX. TrxID 8K3A9B2",
    "senderNumber": "017XXXXXX"
  }
  ```
- **Middleware Applied**: Secret Header Verification (Checks `SMS_WEBHOOK_SECRET`). No JWT required because this is called by an automated device, not a browser client.
- **Logic**:
  - Parses Regex to find the `amount` and `referenceCode`.
  - Queries `paymentIntents` for a `pending` match.
  - Updates intent to `completed`, writes to `escrowDeposits` and `payments`.
- **Success Response** (200 OK):
  ```json
  { "received": true }
  ```
