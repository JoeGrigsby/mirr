# Object register: NFC tags for storyfieldguideprojects.com

Adds a private, unlinked page at `/tags/` plus two Netlify Functions.
Nothing on the existing site changes.

## Files to add to your site's repo

```
public/tags/index.html     the page people land on after a tap
netlify/functions/tap.mjs  handles /t (every tag points here)
netlify/functions/api.mjs  handles /api/* (accounts, roles, transfers)
netlify/lib/core.mjs       shared code, including SUN verification
package.json               adds @netlify/blobs
```

If your site already has a package.json, just add
`"@netlify/blobs": "11.1.4"` to its dependencies.

## Netlify setup

1. **Deploy from Git or the Netlify CLI.** Drag-and-drop deploys don't
   build functions.
2. In Site configuration > Environment variables, add:
   - `SESSION_SECRET`: a long random string (40+ characters). Signs logins.
   - `INVITE_CODE`: any word or phrase. Required to create an account, so
     strangers who find the page can't sign up. Share it with Etta and Joe.
   - `SITE_URL` (optional): `https://storyfieldguideprojects.com`
3. Deploy. Storage (Netlify Blobs) turns on automatically; there's no
   database to set up.

Check: visit `/api/me`. You should see `{"user":null,...}`.

## Trying the Etta / Joe / Lilly flow

1. Etta opens `/tags/`, creates an account and adds "Blue glazed vase".
2. The item page shows a tag URL like `https://storyfieldguideprojects.com/t?c=Ab12Cd34Ef`.
   In NFC Tools: Write > Add a record > URL / URI > paste > Write, and hold
   the phone to the sticker.
3. Tapping now shows Etta "You made and own this", with her records,
   maker's details and ownership history.
4. Etta taps Start a transfer and sends the link to Joe. Joe creates an
   account and taps Accept ownership. He now sees "You own this"; Etta sees
   "You made this" and the history.
5. Lilly taps the vase without signing in and sees only the public page.

## What each role sees

| | Viewer | Owner | Creator |
|---|---|---|---|
| Title, story, maker, materials | yes | yes | yes |
| Owner's public note | yes | yes, edits | yes |
| Private notes, purchase details | | yes, edits | |
| Lost or stolen status | sees banner | sets it | sees banner |
| Start or cancel a transfer | | yes | |
| Edit title, story, materials | | | yes |
| Ownership history, current owner | | | yes |

A person can hold both roles (Etta before the sale). Private notes are
wiped when ownership transfers.

## Switching to secure (SUN) tags later

Once you have the ACR1252U and have turned on SUN, write this URL template to
the tag, with the reader filling the zeros on each tap:

```
https://storyfieldguideprojects.com/t?picc=00000000000000000000000000000000&cmac=0000000000000000
```

Configure the tag with encrypted PICC data (UID and counter mirrored) and a
CMAC over an empty input (MAC input offset = MAC offset). Then set
`SDM_META_KEY` and `SDM_FILE_KEY` (32 hex characters each) to the keys you
programmed. Until they're set, the server uses factory all-zero keys, which
is fine for testing but lets anyone forge a tap.

The first tap of a new secure tag offers to register it to the signed-in
person. After that, copied links are rejected, and accepting a transfer
requires a tap within the last 15 minutes. The verification code matches
NXP's published test vector in application note AN12196.
