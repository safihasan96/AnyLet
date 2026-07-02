# Fix 8: Duplicate Collection Audit

## Verified Collection Names in Active Use

| Canonical Name | Duplicates Found | Files Using It | Action |
|---|---|---|---|
| `tenantMoveIns` | `moveIns` in `PropertyDetails.jsx:147` | `MoveInModal.jsx`, `MyMoveIns.jsx`, `WriteReviewModal.jsx`, `cron-rent-reminders.js` | **Migrate** |
| `viewing_requests` | none | `messageService.js`, `AdminPanel.jsx` | **Keep as-is** |

## Confirmed Finding

`PropertyDetails.jsx` on line 147 queries the collection `moveIns` while the rest of the codebase writes to `tenantMoveIns` via `MoveInModal.jsx`. This means:
- Any check on `PropertyDetails.jsx` to see if a user already lives there is silently broken (it will always return 0 documents).
- The `moveIns` collection in Firestore may be empty or contain orphaned legacy documents.

## Fix Required in PropertyDetails.jsx

Change line 147:
```diff
- collection(db, 'moveIns'),
+ collection(db, 'tenantMoveIns'),
```
