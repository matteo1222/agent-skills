# System Design Interview Framework

Use this when running walkthroughs, mocks, or answer critiques.

## Core Mental Model

- There is no single correct design. The candidate is evaluated on process, tradeoffs, and judgment.
- "Why" matters more than "what". Every major choice should connect to a requirement, access pattern, scale estimate, or failure mode.
- A strong interview feels like a design review with a colleague. The candidate drives, checks alignment at milestones, and adapts to feedback.
- Broad coverage beats deep detail too early. No one can fully design a production system in 45-60 minutes.
- Good design is iterative: identify a requirement, propose a simple approach, assess its limitation, then improve it.

## Step 1: Requirements

Inputs: prompt from interviewer.

Outputs: functional and non-functional requirements.

### Functional Requirements

Treat the system as a black box. Focus on what the product must do, not implementation.

Ask about:

- Main business objects: users, posts, messages, tickets, bookings, files, jobs, payments.
- Object relationships: user to post, user to user, booking to seat, job to artifact.
- Access patterns: "given X, return related Y". Examples: given a user, get their feed; given a ticket, get its order; given a video, get comments.
- Writes: create, update, delete, publish, reserve, pay, deploy.
- Mutability: can objects be edited, deleted, expired, refunded, or restored?
- Media and blobs: images, videos, archives, recordings, logs.
- Ranking, search, filtering, privacy, and authorization.

Validate the list before moving on. A clean phrase:

```text
I think the core requirements are A, B, and C. Before I move into scale and API shape, is there a major workflow you want included or excluded?
```

### Non-Functional Requirements

Pick only the NFRs that materially change the design. Avoid saying every system needs everything.

Common NFRs:

- Performance: Which synchronous, user-facing, frequent paths must be fast?
- Availability: What is the cost of downtime?
- Consistency: What goes wrong if users see stale or conflicting state?
- Durability: What data loss is unacceptable?
- Security: Is there low-trust code, private data, payments, auth, or abuse risk?

Strong candidates also identify what can be relaxed:

```text
For this feed path, I would favor availability and low latency over immediate consistency. A few seconds of stale likes seems acceptable, but failing to load the feed would be worse.
```

## Step 2: Data, API, and Scale

Inputs: requirements and prompt.

Outputs: data types, access patterns/API, and rough scale.

### Data Types

Classify data:

- Structured data: accounts, posts, orders, messages, jobs, metadata.
- Blob/media data: images, videos, archives, recordings.
- Derived data: feeds, counters, search indexes, materialized views.
- Events: notifications, state transitions, audit logs.

### API and Access Patterns

Start with HTTPS-style endpoints unless the problem clearly needs realtime, streaming, or internal RPC.

Keep API sketches concise. The goal is to prove access patterns, not write a full spec.

```text
GET /users/{id}/feed?pageToken=...
POST /users/{id}/posts
POST /tickets/{showId}/holds
POST /holds/{holdId}/payment
```

Guard "get all" patterns with pagination. Ask whether ranking, sorting, filtering, or freshness matters.

### Scale

First decide whether the system is read-heavy, write-heavy, latency-sensitive, storage-heavy, or concurrency-heavy.

Only do back-of-the-envelope math if it will influence the architecture or the interviewer wants it. Use powers of ten and order-of-magnitude thinking.

Useful formulas:

```text
Storage = daily data per user * daily active users * retention window
Bandwidth/sec = daily data transferred / ~100,000 seconds
Requests/sec = daily requests / ~100,000 seconds
```

A strong transition:

```text
We have requirements, API shape, and rough traffic distribution. If useful, I can do quick estimates now; otherwise I can move into the architecture and call out where scale changes the design.
```

## Step 3: Design

Inputs: requirements, data/API/scale, and target NFRs.

Outputs: data storage, services, and deep-dive tradeoffs.

### Storage First

Choose storage based on access patterns and consistency needs.

- Blob storage for large immutable media or archives.
- Relational database when transactions, joins, constraints, or strong consistency matter.
- Non-relational/document/key-value store when horizontal scale, flexible schema, or high write throughput matters more than rich transactional queries.
- Search index when query semantics require text search, filtering, ranking, or inverted indexes.
- Materialized view when a hot read path would otherwise require expensive joins or fanout.

Mention the downside of the chosen storage. This is often stronger than sounding certain.

### Services Second

Services connect the API to storage. Add components only when requirements call for them.

- Load balancer: horizontal scale and high availability for stateless services.
- Cache: expensive-to-compute, frequently read, slowly changing data.
- Queue or pub/sub: asynchronous work, buffering, fanout, retries, event-driven updates.
- CDN: globally distributed static/media delivery.
- Replication/failover: availability and read throughput, with consistency tradeoffs.
- Sharding/consistent hashing: distribute keyspace or load across nodes.

### Deep Dive Selection

Pick the hard part most tied to the problem:

- Feed/social systems: fanout, ranking, caching, write vs read amplification.
- Chat/realtime: WebSockets or long polling, presence, ordering, delivery guarantees.
- Booking/ticketing: concurrency, transactions, holds, payment timeout, exactly-once state transitions.
- ID generation: uniqueness, collision probability, keyspace size, bulk allocation.
- Deployment/jobs: queues, workers, idempotency, status tracking, retries.
- File/media systems: blob storage, metadata, CDN, upload pipeline, deletion/privacy.

## Interviewer Style Adaptation

Warm interviewer:

- Ask clarifying questions and check in at milestones.
- Think aloud more freely.
- Treat the session like a collaborative design review.

Cold interviewer:

- Use more statements than questions.
- Pause to think before speaking.
- Ask for correction without requiring constant engagement:

```text
I am going to proceed assuming X because of Y. Please stop me if that conflicts with what you had in mind.
```

## Recovery Phrases

When unsure:

```text
I have not implemented that specific component before, but I can reason from the constraints. My best guess is X because Y, and the risk would be Z.
```

When handwaving for time:

```text
There is a deep topic here around X. I will name the risk and keep moving so we can finish the full system, then we can return if you want to dig in.
```

When pushing back:

```text
We can remove that component. The tradeoff is X, so I would want an alternative for Y. Does that concern match what you are probing?
```

When choosing:

```text
Both options can work. Given our requirement for X, I will choose A and accept the downside B.
```
