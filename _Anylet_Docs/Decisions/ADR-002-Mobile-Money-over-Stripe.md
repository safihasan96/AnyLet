# ADR-002: Mobile Money SMS Webhook over Stripe

### 1. The Problem (Context & constraints)
AnyLet operates primarily in Bangladesh, a market where credit card penetration is incredibly low (sub 5%). Standard global payment gateways like Stripe, PayPal, or Braintree are practically useless for the target demographic. Users transact almost exclusively via local mobile financial services (MFS) like bKash, Nagad, and Rocket. Integrating official enterprise APIs for these providers requires lengthy corporate approvals, trade licenses, and high setup fees that block rapid prototyping.

### 2. The Decision (The exact technical implementation chosen)
We implemented a custom SMS Webhook architecture. When a user books a property, the system generates a `paymentIntent` with a unique reference code (`ANYLET-XXXX`). The user manually sends money to an AnyLet-owned mobile number. An Android device running an SMS forwarder app receives the carrier's transaction confirmation text and POSTs the raw SMS body to our Vercel serverless function (`api/sms-webhook.js`). The function uses Regex to extract the TrxID and amount, matches it against the database, and releases the escrow.

### 3. The Catch (The resulting engineering trade-offs, technical debt, or operational costs)
This is an inherently fragile, "hacky" solution. If the mobile carrier changes the format of their SMS templates, our Regex parsing will break, requiring an emergency hotfix. It also introduces a single point of failure (the physical Android phone forwarding the SMS). Finally, it lacks true idempotency guarantees from the provider, forcing us to write custom `crypto.timingSafeEqual` logic and ledger verification to prevent replay attacks or forged SMS payloads.
