# X Bookmarks API pricing research

Checked: 2026-07-21
Scope: `GET /2/users/{id}/bookmarks` under X API pay-per-use pricing
Sources: official X documentation only

## Executive summary

X bills the bookmarks lookup as a read of Post resources, not as a flat fee per HTTP request. The normal published Post-read price is **$0.005 per returned Post**. A lower **Owned Read** price of **$0.001 per returned resource** applies only when all of the following are true:

1. The request is made by the developer's own app.
2. `{id}` is the authenticated user.
3. That authenticated user owns the developer app.

The endpoint always requires `{id}` to match the authenticated user, so an app may retrieve a third-party customer's bookmarks after that customer authorizes it. However, an ordinary OAuth customer does not satisfy X's developer-app-owner condition. The best reading of the published pricing is therefore **$0.005 per returned Post for third-party users** and **$0.001 per returned Post for the app owner reading their own bookmarks**. X does not publish a separate row explicitly labeled “third-party bookmark reads,” so the third-party rate is an inference from the default Post-read price and the explicit Owned Read exclusion.

The official pricing page also lists **“Bookmark — $0.005 per request”** under *write operations*. That is not the price of `GET /bookmarks`; reads are billed per returned resource, while bookmark actions are billed per request.

Sources: [X API pay-per-usage pricing and credits](https://docs.x.com/x-api/getting-started/pricing), [Get Bookmarks API reference](https://docs.x.com/x-api/users/get-bookmarks).

## Owned app owner versus third-party app users

| Case | Eligibility | Published or derived rate | Basis |
|---|---|---:|---|
| App owner exports their own bookmarks through their own developer app | `{id}` is the authenticated user and that user owns the app | **$0.001 per returned resource** | Explicit Owned Read price and endpoint eligibility |
| OAuth customer exports their own bookmarks through someone else's app | `{id}` still must be the authenticated customer, but the customer does not own the app | **$0.005 per returned Post** | Derived from default Posts: Read price because Owned Read requirements are not met |
| App attempts to read bookmarks belonging to a user other than the authenticated user | Not allowed by this endpoint | N/A | API reference requires `{id}` to equal the authenticated user |

X's exact Owned Read rule says the reduced price applies when `{id}` matches the authenticated user **and that user is the owner of the developer app**. Consequently, “the user is reading their own bookmarks” is necessary but not sufficient for Owned Read pricing; the same user must also own the app.

Sources: [Owned Reads and read-operation rates](https://docs.x.com/x-api/getting-started/pricing), [authenticated-user path requirement](https://docs.x.com/x-api/users/get-bookmarks).

## Cost scenarios

The table assumes:

- Every returned bookmark is a unique primary Post resource.
- This is the first charged retrieval of each resource in the current UTC day.
- Pages are full at `max_results=100`, except possibly the final page.
- No additional separately billable User, Media, Note, or other expanded resources are included.
- Taxes, payment-processing costs, and future price changes are excluded.

| Bookmarked Posts returned | HTTP requests at 100/page | Owned app owner at $0.001/Post | Third-party app user at $0.005/Post |
|---:|---:|---:|---:|
| 100 | 1 | **$0.10** | **$0.50** |
| 1,000 | 10 | **$1.00** | **$5.00** |
| 10,000 | 100 | **$10.00** | **$50.00** |

Formulas:

- Owned app owner: `returned unique resources × $0.001`
- Third-party app user: `returned unique Posts × $0.005`
- Requests at maximum page size: `ceil(returned Posts / 100)`

Because GET reads are priced per returned resource, the number of pagination requests does not itself multiply the read charge. A full 100-Post page is therefore $0.10 under Owned Read pricing or $0.50 under the default Post-read price. A partially filled final page is charged for the resources actually returned.

Source: [X API pay-per-usage pricing and credits](https://docs.x.com/x-api/getting-started/pricing).

## Pagination and rate limits

The bookmarks endpoint accepts:

- `max_results` from 1 through **100**.
- `pagination_token` to request the next page.
- `meta.next_token` in a response when another page is available.

The published rate limit for `GET /2/users/:id/bookmarks` is:

- Per app: none shown (`—`).
- Per user: **180 requests per 15 minutes**.

At 100 Posts per request, the rate limit permits a theoretical maximum of 18,000 returned Posts in one 15-minute window. A 10,000-bookmark export requires 100 full-page requests and therefore fits within one published per-user rate window. Implementations should still read `x-rate-limit-limit`, `x-rate-limit-remaining`, and `x-rate-limit-reset` response headers and handle HTTP 429 responses.

Sources: [Get Bookmarks API reference](https://docs.x.com/x-api/users/get-bookmarks), [X API rate limits](https://docs.x.com/x-api/fundamentals/rate-limits).

## Billing, credits, caps, and deduplication

### Credits and minimums

X's pay-per-use system requires credits to be purchased upfront in the Developer Console. Credits are deducted as requests return billable resources. When the balance reaches zero, or becomes slightly negative, charged requests are blocked until credits are added.

The public documentation states:

- No subscription is required for pay-per-use.
- There is no contract or minimum spend.
- There is no monthly minimum; zero-usage months may have zero cost.
- There is no publicly documented security deposit.
- There is no publicly documented minimum credit purchase or top-up amount.

The authenticated Developer Console may impose a checkout increment or payment-method minimum that is not stated in the public documentation. It should not be represented as an official minimum without verifying the live checkout for the relevant account and locale.

Sources: [pricing and credit balance](https://docs.x.com/x-api/getting-started/pricing), [Usage and Billing FAQ](https://docs.x.com/x-api/fundamentals/post-cap), [Developer Console overview](https://docs.x.com/fundamentals/developer-portal).

### Daily deduplication

X says billable resources are deduplicated within a 24-hour UTC-day window:

- Re-fetching the same Post within that UTC day normally does not incur another resource charge.
- The window resets at midnight UTC.
- Different Posts returned in one request are individually billable.
- Failed requests that return no data are not billed.

X describes deduplication as a **soft guarantee** and warns that edge cases such as outages can prevent it. Cost controls should cache fetched Post IDs but should not rely on deduplication as an absolute billing guarantee.

Sources: [pricing deduplication policy](https://docs.x.com/x-api/getting-started/pricing), [Usage and Billing](https://docs.x.com/x-api/fundamentals/post-cap).

### Monthly Post-read cap

Pay-per-use plans are capped at **2 million Post reads per monthly billing cycle**. The Usage and Billing documentation explicitly lists Bookmarks among the tracked Post-read endpoints. The 10,000-Post scenario is below that cap, but repeated exports across UTC days consume additional monthly Post reads even when the bookmark set has not changed.

Source: [Usage and Billing](https://docs.x.com/x-api/fundamentals/post-cap).

## Uncertainties and caveats

1. **Third-party rate is derived, not separately labeled.** X explicitly publishes $0.005 for ordinary Post reads and $0.001 for qualifying Owned Reads. It does not publish a row named “bookmark reads for third-party app users.” Applying $0.005 is the direct consequence of not satisfying the Owned Read rule, but the Developer Console remains the authoritative place to confirm the live endpoint price.
2. **Expanded-object billing is not explained.** The bookmarks API can expand authors, media, referenced Posts, polls, places, and other objects. X's pricing table assigns separate read prices to User, Media, Note, and other resource types, but the public documentation does not explicitly say whether objects returned through `expansions` create additional charges. The cost table above excludes such possible charges.
3. **No public checkout minimum is stated.** “No minimum spend” and “no monthly minimum” do not necessarily prove that the payment UI accepts arbitrarily small credit purchases. The live Developer Console is required to verify any minimum top-up amount.
4. **Rates can change.** X states that prices are subject to change and that current rates in the Developer Console are authoritative. These figures were checked on 2026-07-21.
5. **Deduplication is not absolute.** X calls its same-day resource deduplication a soft guarantee, so repeated-read savings may fail in edge cases.
6. **The calculations count only resources actually returned.** Deleted, withheld, unavailable, duplicate, or partially errored bookmark entries may make the number of returned Post resources differ from the number of bookmark records a user expects to export.

## Official sources

- [X API pay-per-usage pricing and credits](https://docs.x.com/x-api/getting-started/pricing)
- [Get Bookmarks API reference](https://docs.x.com/x-api/users/get-bookmarks)
- [Bookmarks overview](https://docs.x.com/x-api/posts/bookmarks/introduction)
- [X API rate limits](https://docs.x.com/x-api/fundamentals/rate-limits)
- [Usage and Billing](https://docs.x.com/x-api/fundamentals/post-cap)
- [Developer Console overview](https://docs.x.com/fundamentals/developer-portal)
