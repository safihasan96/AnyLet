# Graph Report - AnyLet Web  (2026-06-21)

## Corpus Check
- 129 files · ~91,104 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 609 nodes · 1160 edges · 46 communities (35 shown, 11 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `9692f1c1`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]

## God Nodes (most connected - your core abstractions)
1. `useAuth()` - 81 edges
2. `logger` - 46 edges
3. `useToast()` - 43 edges
4. `db` - 43 edges
5. `createNotification()` - 15 edges
6. `auth` - 10 edges
7. `useLanguage()` - 9 edges
8. `scripts` - 8 edges
9. `ConfirmationModal()` - 8 edges
10. `PaymentModal()` - 8 edges

## Surprising Connections (you probably didn't know these)
- `OwnerProfileModal()` --calls--> `useToast()`  [EXTRACTED]
  src/components/OwnerProfileModal.jsx → src/contexts/ToastContext.jsx
- `Enquiry()` --calls--> `useAuth()`  [EXTRACTED]
  src/pages/Enquiry.jsx → src/contexts/AuthContext.jsx
- `Inbox()` --calls--> `useAuth()`  [EXTRACTED]
  src/pages/Inbox.jsx → src/contexts/AuthContext.jsx
- `Onboarding()` --calls--> `useAuth()`  [EXTRACTED]
  src/pages/Onboarding.jsx → src/contexts/AuthContext.jsx
- `Signup()` --calls--> `useAuth()`  [EXTRACTED]
  src/pages/Signup.jsx → src/contexts/AuthContext.jsx

## Import Cycles
- None detected.

## Communities (46 total, 11 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (41): AdminClaimsTab(), AdminKycTab(), DOC_TYPE_LABELS, STATUS_MAP, AdminReviewsTab(), BookPropertyModal(), stepVariants, stepVariants (+33 more)

### Community 1 - "Community 1"
Cohesion: 0.06
Nodes (35): FeaturedListings(), gridVariants, cardVariants, heartVariants, HorizontalPropertyCard(), cardVariants, heartVariants, PropertyCard() (+27 more)

### Community 2 - "Community 2"
Cohesion: 0.06
Nodes (37): Header(), ConversationDetail(), dateLabelVariants, fmtTime(), headerVariants, inputBarVariants, MessageBubble(), messageBubbleVariants (+29 more)

### Community 3 - "Community 3"
Cohesion: 0.05
Nodes (43): dependencies, @capacitor/android, @capacitor/core, @capacitor/ios, @emailjs/browser, firebase, framer-motion, leaflet (+35 more)

### Community 4 - "Community 4"
Cohesion: 0.05
Nodes (38): AboutUs, AddProperty, Admin, Blog, BlogPost, ChangePassword, Contact, ConversationDetail (+30 more)

### Community 5 - "Community 5"
Cohesion: 0.07
Nodes (22): BottomNav(), ErrorBoundary, AuthProvider(), LanguageContext, LanguageProvider(), useLanguage(), ThemeContext, ThemeProvider() (+14 more)

### Community 6 - "Community 6"
Cohesion: 0.14
Nodes (11): ReferralCard(), useReferral(), ReferralDashboard(), WithdrawModal(), Signup(), requestWithdrawal(), clearStoredReferralCode(), formatBDT() (+3 more)

### Community 7 - "Community 7"
Cohesion: 0.08
Nodes (12): LocationPickerMap(), TILE_LAYERS, TILE_LAYERS, districtCoords, divisionCoords, getPropertyCoords(), upazilaCoords, bdLocations (+4 more)

### Community 8 - "Community 8"
Cohesion: 0.10
Nodes (15): ConfirmationModal(), BottomSheet3D(), Modal3D(), OwnerProfileModal(), ShareModal(), PropertyDetailSkeleton(), ViewingRequestModal(), QUERY_LIMITS (+7 more)

### Community 9 - "Community 9"
Cohesion: 0.07
Nodes (27): AdminRoute(), MoveInModal(), OnboardingGuard(), PhoneVerifyModal(), ProtectedRoute(), RoleRoute(), EditProfileSkeleton(), PageSkeleton() (+19 more)

### Community 11 - "Community 11"
Cohesion: 0.12
Nodes (11): accordionVariants, avatarVariants, chevronVariants, heroVariants, itemVariants, kycModalVariants, kycOverlayVariants, pageVariants (+3 more)

### Community 12 - "Community 12"
Cohesion: 0.24
Nodes (11): handler(), ALLOWED_PROVIDERS, handler(), safeCompare(), handler(), handler(), adminAuth(), adminDb() (+3 more)

### Community 13 - "Community 13"
Cohesion: 0.18
Nodes (9): __dirname, main(), OUTPUT_PDF, PAGES, PROJECT_ROOT, sanitizeFilename(), SCREENSHOTS_DIR, SimplePDFBuilder (+1 more)

### Community 14 - "Community 14"
Cohesion: 0.22
Nodes (6): colVariants, containerVariants, linkVariants, logoVariants, SOCIALS, socialVariants

### Community 15 - "Community 15"
Cohesion: 0.40
Nodes (3): app, db, firebaseConfig

### Community 16 - "Community 16"
Cohesion: 0.40
Nodes (3): app, db, firebaseConfig

### Community 17 - "Community 17"
Cohesion: 0.40
Nodes (3): app, db, firebaseConfig

### Community 18 - "Community 18"
Cohesion: 0.40
Nodes (3): app, db, firebaseConfig

### Community 22 - "Community 22"
Cohesion: 0.50
Nodes (3): css, fs, themeCtx

### Community 49 - "Community 49"
Cohesion: 0.10
Nodes (8): Onboarding(), slide, STEPS, fakeListings, app, firebaseConfig, googleProvider, storage

### Community 50 - "Community 50"
Cohesion: 0.40
Nodes (4): FALLBACK_MAP, getPageInfo(), MobileNavBar(), PAGE_CONFIG

## Knowledge Gaps
- **217 isolated node(s):** `ALLOWED_PROVIDERS`, `firebaseConfig`, `app`, `db`, `fs` (+212 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useAuth()` connect `Community 9` to `Community 0`, `Community 1`, `Community 2`, `Community 5`, `Community 6`, `Community 7`, `Community 8`, `Community 11`, `Community 49`?**
  _High betweenness centrality (0.112) - this node is a cross-community bridge._
- **Why does `db` connect `Community 0` to `Community 1`, `Community 2`, `Community 5`, `Community 6`, `Community 7`, `Community 8`, `Community 9`, `Community 11`, `Community 49`?**
  _High betweenness centrality (0.046) - this node is a cross-community bridge._
- **Why does `logger` connect `Community 0` to `Community 1`, `Community 2`, `Community 5`, `Community 6`, `Community 7`, `Community 8`, `Community 9`, `Community 11`, `Community 49`, `Community 31`?**
  _High betweenness centrality (0.039) - this node is a cross-community bridge._
- **What connects `ALLOWED_PROVIDERS`, `firebaseConfig`, `app` to the rest of the system?**
  _217 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.061708860759493674 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.058673469387755105 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.05585106382978723 - nodes in this community are weakly interconnected._