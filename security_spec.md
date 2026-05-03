# Security Specification - Heroic AI RPG Admin & CRM

## Data Invariants
1. A `User` profile must always have an `id` matching their Firebase `auth.uid`.
2. Users can only read their own profile, unless they are a `super_admin`.
3. `UsageLogs` can only be created by the user they belong to.
4. `CreditAdjustments` can only be created by `super_admins`.
5. `News` can be read by anyone, but only edited by `super_admins`.
6. Only `super_admins` can access the `tierConfigs` collection.
7. Users cannot change their own `tier` or `maxCredits`.

## The Dirty Dozen Payloads (Rejection Targets)
1. **Identity Spoofing**: User A attempts to read User B's profile.
2. **Privilege Escalation**: User A attempts to update their `tier` to `super_admin`.
3. **Credit Theft**: User A attempts to update their `currentCredits` directly.
4. **News Defacement**: Unauthenticated user attempts to update a `News` item.
5. **Log Poisoning**: User A attempts to create a `UsageLog` for User B.
6. **Config Overwrite**: Non-admin attempts to change `tierConfigs`.
7. **Shadow Adjustment**: User A attempts to create a `CreditAdjustment` for themselves.
8. **Invalid ID**: Attacker attempts to use a 1KB string as a document ID.
9. **Massive Field**: Attacker sends a 1MB string in the `News` content field.
10. **Orphaned Writes**: Creating a `UsageLog` without a valid `userId`.
11. **Timestamp Spoofing**: User sends a future `createdAt` timestamp.
12. **Status Shortcutting**: User attempts to set `published: true` on News when they aren't admin.
