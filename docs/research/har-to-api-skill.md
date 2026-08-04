# HAR-to-API skill research

_Researched 2026-07-21._

## Recommendation

There is no current, portable Agent Skill worth installing unchanged. Build a thin local `har-to-api` skill around an established converter, with sanitization, endpoint curation, validation, and provenance reporting as the skill's main value.

Use [mitmproxy2swagger](https://github.com/alufers/mitmproxy2swagger) as the default OpenAPI engine. It is the most established candidate (MIT, active, approximately 9.6k stars at review time), accepts HAR, and deliberately uses a two-pass workflow: first infer path templates, then let a human or agent select operations before generating the contract. That review gate is valuable because captured traffic is evidence, not a complete API definition. Its current limitations are OpenAPI 3.0 output and Python 3.12+.

Offer [har-to-openapi](https://github.com/jonluca/har-to-openapi) as an optional fast, one-pass Node engine when OpenAPI 3.1 or library embedding matters. It supports multi-domain filtering and parameter/schema inference, but its current implementation copies observed header, query, and payload values into examples/defaults. It must only run behind mandatory input redaction and an output secret scan.

Keep [traffic2openapi](https://github.com/grokify/traffic2openapi) experimental. Its HAR-to-intermediate-representation-to-OpenAPI architecture, multi-capture merging, and richer inference are good design references, but it is pre-1.0 with minimal adoption and no documented sanitization workflow.

Do not adopt [Reverse API Engineer](https://github.com/kalil0321/reverse-api-engineer) as the skill's client-generation engine without substantial changes. It is the closest end-to-end product—capture/filter HAR, analyze it, and generate typed Python/JavaScript/TypeScript clients—but its [current generation prompt](https://github.com/kalil0321/reverse-api-engineer/blob/02fc798318b6954519850b455fdad5f8248ab911/src/reverse_api/prompts/engineer/system.md) explicitly asks generated clients to hardcode captured credentials, cookies, tokens, and session data. Borrow its staged workflow, not that policy.

## Candidate matrix

| Candidate | Best use | Assessment |
|---|---|---|
| [mitmproxy2swagger](https://github.com/alufers/mitmproxy2swagger) | HAR to curated OpenAPI 3.0 | **Default.** Mature and actively maintained; merging and explicit two-pass path review are strong. Its `--examples` and `--headers` options warn that tokens, passwords, or PII can enter the spec, so disable them by default. |
| [har-to-openapi](https://github.com/jonluca/har-to-openapi) | Fast HAR to OpenAPI 3.0/3.1 | **Optional.** Simple CLI/library and active development, but raw values are retained as examples/defaults unless the wrapper sanitizes them. |
| [traffic2openapi](https://github.com/grokify/traffic2openapi) | Multi-capture inference and analysis | **Experimental.** Rich inference, validation, and diff features; too new and lightly adopted for the default. |
| [Reverse API Engineer](https://github.com/kalil0321/reverse-api-engineer) | Direct runnable client generation | **Do not adopt as-is.** Capable and active, but its credential-hardcoding instruction is a critical blocker. |
| [Postman har-to-postman](https://github.com/postmanlabs/har-to-postman) | Replayable Postman collection | **Good secondary output.** Official converter; a collection should not be presented as an authoritative API contract. |
| [Insomnia HAR import](https://developer.konghq.com/insomnia/import-export/) | Manual traffic inspection/replay | **Useful manual route.** No documented direct headless HAR-to-OpenAPI pipeline. |
| [dcarr178/har2openapi](https://github.com/dcarr178/har2openapi) | Historical reference | **Avoid.** Very small, inactive implementation; its own workflow expects noisy output and iterative manual configuration. |

## Existing Agent Skills

The exact packaged-skill matches found during the audit are not install-ready:

- Patrick Ruddiman's [`decompose`](https://github.com/PatrickRuddiman/skills/blob/c8f43b0a93f2ddc2c06860be0c7178fa7a66912b/decompose/SKILL.md) is the closest broad end-to-end skill and has sensible safeguards, but it is much broader than HAR conversion and provides no deterministic conversion scripts.
- Zotero's [`capture-api`](https://github.com/zotero/translators/blob/60f2d542ffcd3bb1208b0d991e9c8e8fc849a1f7/.agent/skills/capture-api/SKILL.md) skill packages a [HAR capture helper](https://github.com/zotero/translators/blob/60f2d542ffcd3bb1208b0d991e9c8e8fc849a1f7/.bin/capture-har.mjs) and a two-pass `mitmproxy2swagger` flow. It is repository-specific and records a full HAR without a mandatory redaction stage.
- [`api-pattern-extractor`](https://github.com/majiayu000/claude-skill-registry/blob/ef926663574f5f7a0c19b0429b2540373279ed45/skills/api/api-pattern-extractor/SKILL.md) claims the desired workflow, but the referenced tool scripts are missing from its directory; only instructions and metadata are present.
- The Agent Skills Exchange [`bootstrap-openapi-spec-from-captured-api-traffic-before-client-or-test-automation`](https://github.com/agentskillexchange/skills/blob/76978b1aabaf3509d593670a2c288d5646bc8dfd/skills/bootstrap-openapi-spec-from-captured-api-traffic-before-client-or-test-automation/SKILL.md) wrapper points at stale upstream details and does not meet current skill packaging expectations.
- [`climaker`](https://github.com/barkleesanders/claude-code-starter/blob/96a481d822c17c2332b9cdb969ab53edfdebe03e/skills/climaker/SKILL.md) adds a [shell wrapper around `har-to-openapi`](https://github.com/barkleesanders/claude-code-starter/blob/96a481d822c17c2332b9cdb969ab53edfdebe03e/skills/climaker/tools/har2spec.sh) as part of a much heavier CLI-generation chain and does not solve HAR secret redaction.
- A marketplace-advertised `reverse-engineering-api` skill refers to a `SKILL.md` path that is absent from the current Reverse API Engineer repository, so it should not be installed unpinned.

These are useful references, but none changes the recommendation to build a small, auditable wrapper skill.

## Proposed skill contract

Suggested interface:

```text
har-to-api <capture.har>
  --target openapi|client|postman
  --include-domain <host>...
  --exclude <glob>...
  --language typescript|python|...
  --multi-capture <capture.har>...
  --allow-examples              # off by default
  --authorized-replay           # off by default
```

Required workflow:

1. Validate scope and parse the HAR tolerantly from a temporary copy; never rewrite the source.
2. Sanitize **before any model or converter sees the data**. Remove or replace `Authorization`, `Cookie`, `Set-Cookie`, API keys, CSRF tokens, JWTs, passwords, secret-named query/body fields, and likely PII while preserving types and shapes.
3. Apply a host allowlist and discard static assets, telemetry, advertising, source maps, and other non-API traffic.
4. For `target=openapi`, run `mitmproxy2swagger` pass one, review/edit path templates, then run pass two with examples and captured headers disabled by default.
5. Preserve an evidence map from every operation to its source HAR entries. Label schema, requiredness, authentication, pagination, and enum claims as `observed` or `inferred`.
6. Scan the output for secrets, then lint/validate it. [Redocly CLI lint](https://redocly.com/docs/cli/commands/lint/) is suitable for contract linting. Report hosts, input entries, generated operations, observed status codes, missing bodies, and dropped entries.
7. For `target=client`, generate from the validated OpenAPI document with [OpenAPI Generator](https://openapi-generator.tech/docs/usage/), rather than asking a model to copy credentials or fabricate a client directly from raw traffic.
8. For `target=postman`, use the official Postman converter and retain the same sanitization and output scanning.
9. Only replay or smoke-test requests with explicit authorization. Supply secrets externally at runtime; never embed captured values.

## Safety and epistemic limits

HAR is a historical JSON interchange format, not a complete API-contract standard. The W3C page now labels its [HAR specification as an abandoned historical draft](https://w3c.github.io/web-performance/specs/HAR/Overview.html), and the draft itself notes that HAR can contain privacy- and security-sensitive data.

[Chrome DevTools exports a sanitized HAR by default](https://developer.chrome.com/docs/devtools/network/reference/), excluding `Cookie`, `Set-Cookie`, and `Authorization`, but that is not sufficient protection: secrets and personal data may also appear in URLs, arbitrary headers, and request/response bodies.

A capture can establish only what was observed. It cannot reliably reveal uncalled endpoints, optional fields, complete enums, error variants, polymorphism, rate limits, authorization scopes, token refresh behavior, or business preconditions. Multiple captures improve confidence but do not turn inferred behavior into a source-of-truth contract. The skill should say this plainly in every report.

## Bottom line

Create a focused `har-to-api` skill whose core is **sanitize -> filter -> curate -> convert -> validate -> report provenance**. Use `mitmproxy2swagger` for the default deterministic contract path, `har-to-openapi` as an explicitly less-safe fast path behind the same guardrails, the official Postman converter for collection output, and OpenAPI Generator for typed clients.
