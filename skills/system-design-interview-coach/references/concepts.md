# Technical Concept Coaching

Use this as a compact teaching map. Explain only what the user's current problem needs, then make them apply it.

## Three Meta Concepts

| Concept | Coaching Point |
| --- | --- |
| No single right answer | A design succeeds when choices fit stated requirements and tradeoffs are understood. |
| Rules of thumb are tools, not laws | "Use a cache" or "use a queue" only matters when it connects to a bottleneck or failure mode. |
| Communication changes score | The candidate should state uncertainty, choose, justify, and collaborate. |

## Twelve Technical Concepts

| Concept | Bring It Up When | Candidate Should Be Able To Say |
| --- | --- | --- |
| APIs | Defining access patterns or service boundaries | REST is a strong default for external resource APIs. RPC can fit internal service calls. GraphQL can fit client-shaped graph data. |
| SQL vs NoSQL | Choosing metadata storage | SQL fits transactions, joins, constraints, and strong consistency. NoSQL fits flexible schema, horizontal scale, high write volume, and eventual consistency. |
| Scaling | Throughput exceeds one machine or one service instance | Vertical scaling is simpler but bounded. Horizontal scaling improves capacity and availability but adds distributed coordination. |
| CAP theorem | Discussing consistency during network partitions | In a partition, a system cannot fully preserve consistency and availability for the same data. Say what the product can tolerate. |
| Web auth/basic security | Private data, user accounts, payments, or low-trust actions | Use HTTPS, authenticated sessions/tokens, authorization checks, encrypted sensitive data, rate limits, and isolation for untrusted code. |
| Load balancers | Many stateless API/service instances | They spread traffic, allow rolling deploys, and remove unhealthy nodes. Statefulness makes balancing harder. |
| Caching | Hot reads are expensive and data changes slowly | Caches trade freshness and complexity for lower latency and load. Invalidation is the hard part. |
| Queues/pub-sub | Async work, retries, smoothing spikes, fanout, events | Queues decouple producers and consumers. Discuss ordering, retries, idempotency, backpressure, and dead letters if relevant. |
| Indexing | Reads filter/sort by non-primary fields | Indexes speed reads but cost write/storage overhead. "Get all" needs pagination. |
| Failover | Leader or service instance can fail | Detect unhealthy nodes, promote or route to healthy replicas, and avoid split-brain or lost writes. |
| Replication | Need availability, read throughput, or locality | Synchronous replication improves consistency at latency cost. Asynchronous replication improves latency but risks stale reads or lost updates. |
| Consistent hashing | Sharding/cache nodes change over time | Hash rings reduce key movement when nodes join/leave. Virtual nodes smooth load. |

## Common Decision Heuristics

### SQL vs NoSQL

Ask:

- Do we need transactions or strong consistency for correctness?
- Are entities tightly related with queryable relationships?
- Is schema stable or highly flexible?
- Is the workload read-heavy, write-heavy, or mixed?
- Will access patterns be known and narrow, or ad hoc?

Good answer shape:

```text
I will choose relational storage for orders and payments because double-booking or incorrect payment state is a correctness issue. The downside is that scaling writes is harder, so I would shard by event or region once volume demands it.
```

### Cache

Use a cache when all three are true:

- The result is expensive to compute or fetch.
- It is read often.
- It does not change constantly, or stale data is acceptable.

Discuss:

- TTL vs explicit invalidation.
- Cache-aside vs write-through at a high level.
- Source of truth remains persistent storage.
- Stale reads and cache stampede.

### Queue or Pub/Sub

Use when:

- Work can happen asynchronously.
- Producers and consumers have different throughput.
- Retries and buffering matter.
- One event fans out to many downstream updates.

Discuss:

- At-least-once delivery means consumers should be idempotent.
- Ordering is usually scoped by key, not global.
- Backpressure and dead-letter handling.

### Realtime Delivery

Short polling:

- Simple but wasteful at scale.

Long polling:

- Better when events are frequent enough, but connections can time out.

WebSockets:

- Best fit for bidirectional, low-latency updates such as chat, collaborative editing, or live seat maps.

### ID Generation

Clarify:

- Must IDs be globally unique or just practically unique?
- How large can IDs be?
- How many IDs per second are needed?
- Are IDs exposed to users or required to be sortable?

Common approaches:

- Random UUID when collision risk is acceptable and keyspace is large.
- Prefix with machine/session/time plus local counter when practical uniqueness and throughput matter.
- Bulk allocation from a strongly consistent coordinator when strict uniqueness and dense keyspace matter.

Red flag: storing every issued ID just to check uniqueness at massive scale.

### Booking and Concurrency

For seats, hotel rooms, inventory, or payments:

- State what can go wrong: double booking, stale holds, payment completing after timeout, server crash mid-flow.
- Prefer a transactional source of truth for the contested resource.
- Use hold expiration timestamps rather than relying only on cleanup jobs.
- Make payment completion idempotent.

### Feed Systems

Clarify:

- Chronological vs ranked.
- Follow graph size.
- Fanout on write vs fanout on read.
- Freshness and celebrity/high-fanout accounts.

Simple path:

- Start with posts and follows.
- Identify that feed reads are hot.
- Improve with materialized feeds, caching, or hybrid fanout if requirements demand it.

## Concept Drill Pattern

After teaching a concept, ask:

```text
Apply that to [problem]. Would you use [component/approach]? Give me the requirement that justifies it, one downside, and one alternative.
```
