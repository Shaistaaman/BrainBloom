# BrainBloom Security Specification

## Data Invariants
1. A user profile cannot be created by anyone other than the authenticated user with matching UID.
2. XP and Level can only be incremented, never decremented (except by admins).
3. `userProgress` must always belong to the authenticated user.
4. Card progress must reference a valid card ID.

## The Dirty Dozen Payloads (Target: Security Failure)
1. **Identity Spoofing**: Attempt to write to `/users/attacker-uid` with `uid: "victim-uid"`.
2. **XP Injection**: Attempt to update `points` to `999999` directly.
3. **Ghost Progress**: Create card progress for a non-existent card.
4. **Public Progress**: Attempt to read another user's `userProgress` subcollection.
5. **Deck Vandalism**: Attempt to delete a public deck as a normal user.
6. **Card scraping**: Attempt to list ALL cards from all decks without authentication.
 ... (and so on)

## The Test Runner (Logic Check)
Verified against the following ruleset.
