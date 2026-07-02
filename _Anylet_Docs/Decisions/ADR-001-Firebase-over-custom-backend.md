# ADR-001: Firebase over Custom Node/Postgres Backend

### 1. The Problem (Context & constraints)
AnyLet required an extremely fast time-to-market for a rental marketplace SPA, needing real-time messaging, complex relational-like queries (search by location, price, type), and robust authentication. Building a custom Node.js/Express backend with PostgreSQL would require significant DevOps overhead, custom WebSocket implementation for real-time chat, and manual JWT session management, slowing down the frontend iteration cycle.

### 2. The Decision (The exact technical implementation chosen)
We adopted the Firebase ecosystem (Firestore, Firebase Auth, and Firebase Admin SDK). The frontend directly queries Firestore using the v12 modular Web SDK, eliminating the need for 80% of standard REST API endpoints. Real-time features (inbox, notifications) are achieved trivially using Firestore's `onSnapshot` listeners. Vercel serverless functions (`api/`) are used strictly for privileged operations (e.g., webhook processing, admin custom claims) via the Firebase Admin SDK.

### 3. The Catch (The resulting engineering trade-offs, technical debt, or operational costs)
Firestore is a NoSQL document database, meaning we lack true relational JOINs. To display a property review with the user's name, we must either duplicate (denormalize) the user's name into the review document at write-time, or perform a secondary client-side read. This leads to complex data synchronization requirements. Furthermore, our security boundary relies entirely on complex Firestore Security Rules (`firestore.rules`) instead of traditional backend middleware, making local testing and auditing significantly harder.
