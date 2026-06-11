# Drills and Practice Prompts

Use these to run focused practice. Keep drills short, score one skill, then repeat with a variation.

## Drill Formats

### Requirements Drill

Goal: identify objects, relationships, access patterns, mutability, and NFR priorities.

Instructions:

1. Give a one-line prompt.
2. Candidate asks clarifying questions.
3. Answer only what they ask.
4. Stop after requirements and score problem framing.

Scoring emphasis:

- Did they avoid assuming a famous product clone?
- Did they identify main objects and relationships?
- Did they ask about access patterns and mutability?
- Did they choose NFRs that change the design?

### API and Scale Drill

Goal: turn requirements into API shape, data types, read/write ratio, and rough estimates.

Instructions:

1. Provide a completed requirement list.
2. Candidate writes 3-6 endpoints or operations.
3. Candidate classifies data and estimates read/write/storage shape.
4. Push once on pagination, hot paths, or whether estimates matter.

### Tradeoff Drill

Goal: make a decision instead of listing options.

Prompt shape:

```text
For [problem], choose SQL or NoSQL / cache or no cache / queue or synchronous call. Give the requirement, your decision, the downside, and one case that would change your mind.
```

### Deep Dive Drill

Goal: reason through one hard part.

Good deep dives:

- Ticketing: prevent double booking and handle payment timeout.
- Chat: message ordering, realtime delivery, and offline users.
- Feed: fanout strategy and celebrity accounts.
- ID generation: strict vs practical uniqueness.
- Deployment system: idempotent workers and retries.
- Pastebin/TinyURL: key generation, expiration, and deletion.

### Communication Drill

Goal: recover from uncertainty and interviewer pushback.

Give a challenge:

- "Why not use a relational database?"
- "I would not add a cache here."
- "What if this node fails?"
- "You are spending too long on API details."
- "You said Kafka. Why Kafka instead of another queue?"

Candidate must respond with:

- Acknowledgement.
- Technical reasoning.
- Decision or adjustment.
- Collaborative check-in.

## Mock Prompt Bank

### Easy to Medium

- Design Pastebin or a text snippet sharing service.
- Design TinyURL.
- Design a photo upload and sharing service.
- Design a notification service.
- Design a rate limiter.
- Design a job queue for background tasks.
- Design a code deployment system for an internal company platform.

### Medium to Hard

- Design a Twitter/X-style feed.
- Design TikTok simplified to image posts.
- Design a chat application.
- Design an interview scheduling and recording platform.
- Design a file storage service like Dropbox.
- Design a metrics ingestion service.
- Design a collaborative document editor at a high level.

### Hard or Senior+

- Design Ticketmaster.
- Design a distributed unique ID generation service.
- Design a deduplication service.
- Design a payment workflow for marketplace checkout.
- Design a live leaderboard.
- Design a search autocomplete system.
- Design a globally available feature flag service.

## Problem Family Notes

### Pastebin/TinyURL

Core signals:

- Immutable or mostly immutable content is simpler.
- Blob/document storage can be enough.
- Key generation and collision handling matter.
- Expiration/deletion/privacy can change storage and indexing.

Common follow-ups:

- Custom aliases.
- Abuse detection.
- Analytics.
- GDPR/private deletion.
- Hot links and caching/CDN.

### Feed/Social

Core signals:

- Access patterns drive the design.
- Feeds are usually read-heavy.
- Fanout on read is simpler; fanout on write/materialized feeds improve hot reads with more write complexity.
- Ranking is a product requirement, not an automatic default.

Common follow-ups:

- Users with millions of followers.
- Media storage and CDN.
- Likes/comments consistency.
- Mutability and deletion propagation.

### Chat/Realtime

Core signals:

- WebSockets are often better than polling for bidirectional realtime messaging.
- Store messages durably before acknowledging if durability matters.
- Ordering is usually per conversation, not global.
- Offline delivery and unread state are separate from realtime transport.

Common follow-ups:

- Presence.
- Message edits/deletes.
- Group chat fanout.
- Push notifications.

### Ticketing/Booking

Core signals:

- State the failure modes before designing.
- Contested resources need strong consistency.
- Holds need expiration timestamps.
- Payment callbacks must be idempotent.
- SQL transactions are often a good fit for the core reservation state.

Common follow-ups:

- Live seat map via materialized view and push updates.
- Queue/waiting room.
- Sharding by event.
- Regional failover.

### ID Generation

Core signals:

- Clarify strict uniqueness, keyspace size, throughput, sortability, and user exposure.
- Random IDs are often good enough if collision cost is low and keyspace is large.
- Strict dense allocation requires coordination.
- Bulk range allocation reduces coordinator load.

Common follow-ups:

- Avoid sequential IDs exposed to users.
- Handle node restart.
- Bulk wastage when nodes die.
- Clock skew if timestamp-based.

## Model Answer Protocol

When the user asks for a solution instead of a mock:

1. State one reasonable interpretation of the prompt.
2. Give requirements and NFRs.
3. Outline data/API/scale.
4. Present a simple baseline architecture.
5. Improve the bottleneck most relevant to the problem.
6. Name alternatives and when they would be better.
7. End with likely interviewer follow-ups.

Never present the answer as the only correct design.
