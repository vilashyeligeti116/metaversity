# Metaversity TODO - Office Entry Bug Fix

## Current Issue

Founder clicks "Enter My Office" → redirected back home. spaceId null from user.officeId.

## Steps

- [x] Understand routing in App.jsx: page='office' requires user.officeId.spaceId
- [ ] Fix App.jsx to parse /office/{spaceId} URL param for direct entry
- [ ] Verify server/users.js /my-office populates spaceId
- [ ] Test full flow: idea → approve → assign office → founder enter office
- [ ] Update FounderHome to link /office/{spaceId}
- [ ] Restart dev servers
- [ ] Confirm no redirect loop
