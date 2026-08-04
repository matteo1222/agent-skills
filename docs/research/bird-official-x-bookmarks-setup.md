# Personal X app setup for Bird bookmark export

Checked: 2026-07-22
Scope: personal app owner using the official `GET /2/users/{id}/bookmarks` endpoint at Owned Read pricing
Sources: official X documentation and `jawond/bird` main at [`c0d08f3`](https://github.com/jawond/bird/tree/c0d08f32352fd8e0063d69c9b57760ff4c940b11)

## Short actionable checklist

1. Sign in to [console.x.com](https://console.x.com) with the **same personal X account whose bookmarks will be exported**. Accept the developer agreement, complete the developer profile, and create a new app with its name, description, and use case. Save credentials when shown; X says they may only be displayed once. [Getting Access](https://docs.x.com/x-api/getting-started/getting-access)
2. In the app's authentication settings, enable **OAuth 2.0** and choose **Native App**. X classifies Native Apps as public clients, so the CLI uses PKCE and does not embed a Client Secret. Save the Client ID. [Apps](https://docs.x.com/fundamentals/developer-apps), [OAuth 2.0 Authorization Code with PKCE](https://docs.x.com/fundamentals/authentication/oauth-2-0/authorization-code)
3. Register one exact local callback URI, for example `http://127.0.0.1:8787/oauth/callback`. X requires an exact match, including trailing slashes, and explicitly says local development should use `127.0.0.1`, not `localhost`. [Apps: callback URLs](https://docs.x.com/fundamentals/developer-apps)
4. Purchase X API credits and set a low spending limit in the Developer Console. Credits are prepaid; requests stop when the balance is exhausted. X publishes no subscription or minimum spend. It does not publicly document the checkout's minimum top-up amount. [Pricing](https://docs.x.com/x-api/getting-started/pricing)
5. Run the proposed `bird x auth login --client-id …`. Request exactly `tweet.read users.read bookmark.read offline.access`; `offline.access` is needed to receive a refresh token. Do not request `bookmark.write` for export-only access. [Bookmarks Lookup](https://docs.x.com/x-api/posts/bookmarks/quickstart/bookmarks-lookup), [OAuth scopes and refresh tokens](https://docs.x.com/fundamentals/authentication/oauth-2-0/authorization-code)
6. After authorization, call `GET https://api.x.com/2/users/me` with the user access token and show the returned handle and ID. Confirm it is the same X account that owns the developer app; this owner match is required for the `$0.001`-per-resource Owned Read price. [Authenticated User Quickstart](https://docs.x.com/x-api/users/lookup/quickstart/authenticated-lookup), [Owned Read pricing](https://docs.x.com/x-api/getting-started/pricing)
7. Run the proposed `bird bookmarks export --output bookmarks.json`. Fetch pages with `max_results=100`, pass `meta.next_token` back as `pagination_token`, and stop when no next token remains. [Get Bookmarks](https://docs.x.com/x-api/users/get-bookmarks)

## Exact OAuth 2.0 PKCE flow

Use a **public Native App** flow for a locally installed CLI:

1. Generate a fresh random `state` and PKCE `code_verifier`; derive an `S256` `code_challenge` (X supports `S256` and `plain`). Start the loopback listener before opening the browser.
2. Open:

   ```text
   https://x.com/i/oauth2/authorize
     ?response_type=code
     &client_id=CLIENT_ID
     &redirect_uri=http%3A%2F%2F127.0.0.1%3A8787%2Foauth%2Fcallback
     &scope=tweet.read%20users.read%20bookmark.read%20offline.access
     &state=RANDOM_STATE
     &code_challenge=BASE64URL_SHA256_VERIFIER
     &code_challenge_method=S256
   ```

3. On the callback, reject a mismatched `state`, handle denial/error parameters, and exchange `code` promptly; X documents a 30-second authorization-code lifetime.
4. For this public client, POST `application/x-www-form-urlencoded` to `https://api.x.com/2/oauth2/token` with `code`, `grant_type=authorization_code`, `client_id`, the exact `redirect_uri`, and `code_verifier`. No Client Secret or Basic authorization header is used for the public-client exchange.
5. Access tokens last two hours by default. Because `offline.access` was requested, refresh with the same token endpoint using `refresh_token`, `grant_type=refresh_token`, and `client_id`. Use `Authorization: Bearer USER_ACCESS_TOKEN` for `/2/users/me` and bookmarks calls. X does not publicly document an absolute refresh-token lifetime or rotation semantics, so persist any newly returned token set atomically and serialize refresh attempts.
6. On logout, revoke at `POST https://api.x.com/2/oauth2/revoke` and remove local credentials.

Official request parameters and token examples: [OAuth user-access-token flow](https://docs.x.com/fundamentals/authentication/oauth-2-0/user-access-token), [OAuth lifetime and scopes](https://docs.x.com/fundamentals/authentication/oauth-2-0/authorization-code).

## Practical Bird CLI shape

```bash
# One-time personal app setup
bird x auth login \
  --client-id "$X_CLIENT_ID" \
  --callback http://127.0.0.1:8787/oauth/callback

# Verify the authorized account/app-owner identity
bird x auth status

# Export all bookmarks through the official API
bird bookmarks export --output bookmarks.json --format json

# Remove authorization and local tokens
bird x auth logout
```

`auth login` should print the URL if opening a browser fails. `auth status` should call `/2/users/me`, not trust a manually entered user ID. `bookmarks export` should refresh shortly before token expiry, retry once after a refreshable 401, respect `x-rate-limit-reset` on 429, checkpoint the latest pagination token, deduplicate Post IDs, and write output atomically. Do not stop merely because a page contains fewer than 100 results; stop only when `meta.next_token` is absent. The published limits are 75 `/2/users/me` requests and 180 bookmarks requests per 15 minutes per user. [X API rate limits](https://docs.x.com/x-api/fundamentals/rate-limits)

## How to integrate this into Bird

Bird currently has a Commander CLI and JSON5 config in [`src/index.ts`](https://github.com/jawond/bird/blob/c0d08f32352fd8e0063d69c9b57760ff4c940b11/src/index.ts#L12-L147), but its X transport is an **internal GraphQL cookie client**: [`TwitterClient`](https://github.com/jawond/bird/blob/c0d08f32352fd8e0063d69c9b57760ff4c940b11/src/lib/twitter-client.ts#L115-L194) injects `auth_token`/`ct0` cookies and a web bearer token. Its `getCurrentUser()` also probes internal/legacy endpoints and scrapes settings HTML rather than calling official `/2/users/me`. [`twitter-client.ts`](https://github.com/jawond/bird/blob/c0d08f32352fd8e0063d69c9b57760ff4c940b11/src/lib/twitter-client.ts#L694-L817)

Do not add the official user token to that client. Add three separate modules:

- `src/lib/x-oauth.ts`: PKCE generation, loopback callback, code exchange, refresh, and revoke.
- `src/lib/x-token-store.ts`: secure token persistence and non-secret account metadata.
- `src/lib/x-api-client.ts`: official `getMe()` and `getBookmarksPage({ userId, paginationToken, maxResults })` methods against `https://api.x.com/2`.

Add the four CLI actions shown above in `src/index.ts`. Keep bookmark export explicitly on the official client instead of sending it through the existing `graphql | sweetistics | auto` selector; those modes currently choose between cookie GraphQL and Sweetistics only. This avoids implying that the new OAuth token works with Bird's existing internal GraphQL calls.

For response mapping, Bird's current [`TweetData`](https://github.com/jawond/bird/blob/c0d08f32352fd8e0063d69c9b57760ff4c940b11/src/lib/twitter-client.ts#L57-L70) holds text, author name/username, timestamps, counts, and reply/conversation IDs. The official bookmark response should initially be retained as a v2-shaped export (`data`, `includes`, `meta`) or mapped by a dedicated type; do not force it through the current GraphQL-shaped parser. Author names require `expansions=author_id`; attached media and referenced Posts require their own expansions. X's public pricing docs do not state clearly whether expanded User/Media resources add separate charges, so expose a minimal/default field set and make richer expansions opt-in.

Bird has no storage dependency and otherwise uses only small JavaScript packages. [`package.json`](https://github.com/jawond/bird/blob/c0d08f32352fd8e0063d69c9b57760ff4c940b11/package.json#L1-L39) It already invokes the macOS Keychain command while reading Chrome cookies. [`cookies.ts`](https://github.com/jawond/bird/blob/c0d08f32352fd8e0063d69c9b57760ff4c940b11/src/lib/cookies.ts#L74-L131) A pragmatic first token store is therefore:

- macOS: Keychain item keyed by service `bird.x.oauth` and Client ID/user ID;
- other platforms/CI: a secure-vault adapter or explicit environment variables;
- JSON5 config: only non-secret `xClientId`, callback URI, user ID, granted scopes, and expiry metadata.

Never put access or refresh tokens in `.birdrc.json5`, logs, command output, or the repository. X recommends an encrypted database or secure vault for access tokens and stronger controls for refresh tokens. [X security guidance](https://docs.x.com/fundamentals/security)

Minimum tests: PKCE/state validation, callback timeout/denial, public-client token exchange form, refresh and token replacement, `/2/users/me` identity mapping, one- and multi-page bookmarks, missing/repeated next tokens, 401 refresh retry, 429 reset handling, partial errors, atomic export, and secret-redaction assertions. Existing Bird fetch-mocking patterns are in [`tests/twitter-client.test.ts`](https://github.com/jawond/bird/blob/c0d08f32352fd8e0063d69c9b57760ff4c940b11/tests/twitter-client.test.ts#L184-L298).

## Owned Reads and billing guardrail

X prices `GET /2/users/{id}/bookmarks` at **$0.001 per returned resource** only when `{id}` equals the authenticated user and that user owns the developer app. Creating the app and completing OAuth with the same personal X account is therefore essential. Normal Post reads are $0.005 per resource. Credits are purchased upfront; set a conservative spending limit before testing. [X pricing](https://docs.x.com/x-api/getting-started/pricing)

## Console details not publicly verifiable

The public docs establish the workflow but do not expose the authenticated console screens. Verify these live rather than hard-coding instructions around them:

- Current button/menu labels and whether a “Project” is created separately or implicitly with the app.
- Any mandatory website, organization, terms, privacy-policy, or use-case fields.
- Whether scope selection appears as console checkboxes; OAuth scopes must still be requested in the authorization URL.
- The minimum credit purchase/top-up amount, supported payment methods, taxes, and locale-specific billing behavior.
- Where the spending-limit control appears and its allowed minimum/increments.
- How app ownership is represented for organization/team accounts. This note assumes a personal developer account owned by the same X user who authorizes the CLI.
- Refresh-token lifetime and rotation behavior; X documents the refresh request but not those lifecycle details.

## Official X sources

- [Getting Access](https://docs.x.com/x-api/getting-started/getting-access)
- [Apps and callback URLs](https://docs.x.com/fundamentals/developer-apps)
- [OAuth 2.0 Authorization Code with PKCE](https://docs.x.com/fundamentals/authentication/oauth-2-0/authorization-code)
- [OAuth user-access-token flow](https://docs.x.com/fundamentals/authentication/oauth-2-0/user-access-token)
- [Bookmarks Lookup quickstart](https://docs.x.com/x-api/posts/bookmarks/quickstart/bookmarks-lookup)
- [Get Bookmarks API reference](https://docs.x.com/x-api/users/get-bookmarks)
- [Authenticated User quickstart](https://docs.x.com/x-api/users/lookup/quickstart/authenticated-lookup)
- [Pricing and Owned Reads](https://docs.x.com/x-api/getting-started/pricing)
- [Rate limits](https://docs.x.com/x-api/fundamentals/rate-limits)
- [Security](https://docs.x.com/fundamentals/security)
