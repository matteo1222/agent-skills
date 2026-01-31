---
name: logging-best-practices
description: Wide events and canonical log lines for debuggable systems. High-cardinality, high-dimensionality logging patterns that make debugging analytics, not archaeology. Use when implementing logging, reviewing observability code, or debugging production issues.
---

# Logging Best Practices: Wide Events & Canonical Log Lines

Your logs are lying to you. Not maliciously. They're just not equipped to tell the truth.

## The Core Problem

Logs were designed for monoliths and single servers. Today, a single request touches 15 services, 3 databases, 2 caches, and a message queue. Traditional logging emits 15-20 lines per request with minimal context. At 10,000 concurrent users, that's 130,000+ lines/second saying nothing useful.

**String search is broken.** When you search for `user-123`, you find it logged 47 different ways:
- `user-123`
- `user_id=user-123`
- `{"userId": "user-123"}`
- `[USER:user-123]`
- `processing user: user-123`

And downstream services only logged the order ID. Now you need a second search. And a third.

> Logs are optimized for _writing_, not for _querying_.

## Key Terminology

| Term | Definition |
|------|------------|
| **Structured Logging** | Logs as key-value pairs (JSON) instead of strings. Necessary but not sufficient. |
| **Cardinality** | Number of unique values a field can have. `user_id` = high (millions). `http_method` = low (GET, POST, etc.). High cardinality is what makes debugging possible. |
| **Dimensionality** | Number of fields in your log event. More dimensions = more questions you can answer. |
| **Wide Event** | Single, context-rich log event per request per service. 50+ fields instead of 13 log lines. |
| **Canonical Log Line** | Same as wide event. One authoritative record per request. |

## Why OpenTelemetry Alone Won't Save You

OpenTelemetry is a **protocol and SDK set**. It standardizes collection and export. What it does NOT do:

1. **Decide what to log** - You still instrument deliberately
2. **Add business context** - User tier, cart value, feature flags? You add them.
3. **Fix your mental model** - Bad instrumentation in standardized format is still bad

```typescript
// BAD: "We use OpenTelemetry!"
app.post('/checkout', async (req, res) => {
  const span = trace.getActiveSpan();
  try {
    const order = await processOrder(req.body);
    res.json(order);
  } catch (error) {
    span?.recordException(error);
    res.status(500).json({ error: 'Failed' });
  }
});
```

```typescript
// GOOD: Deliberate instrumentation with business context
app.post('/checkout', async (req, res) => {
  const span = trace.getActiveSpan();
  const user = req.user;

  // Add business context BEFORE processing
  span?.setAttributes({
    'user.id': user.id,
    'user.subscription': user.plan,
    'user.lifetime_value': user.ltv,
    'cart.item_count': req.body.items.length,
    'cart.total_cents': req.body.total,
    'feature_flags': JSON.stringify(user.flags),
    'checkout.payment_method': req.body.paymentMethod,
  });

  try {
    const order = await processOrder(req.body);
    span?.setAttributes({
      'order.id': order.id,
      'order.status': order.status,
      'payment.provider': order.paymentProvider,
      'payment.latency_ms': order.paymentLatency,
    });
    res.json(order);
  } catch (error) {
    span?.setAttributes({
      'error.type': error.name,
      'error.code': error.code,
      'error.retriable': error.retriable,
    });
    span?.recordException(error);
    res.status(500).json({ error: 'Failed' });
  }
});
```

OTel is plumbing. YOU decide what flows through it.

## The Fix: Wide Events / Canonical Log Lines

Mental model shift:

> Instead of logging _what your code is doing_, log _what happened to this request_.

For each request, emit **one wide event** per service hop with every piece of context that might be useful.

### Wide Event Structure

```json
{
  "timestamp": "2025-01-15T10:23:45.612Z",
  "request_id": "req_8bf7ec2d",
  "trace_id": "abc123",

  "service": "checkout-service",
  "version": "2.4.1",
  "deployment_id": "deploy_789",
  "region": "us-east-1",

  "method": "POST",
  "path": "/api/checkout",
  "status_code": 500,
  "duration_ms": 1247,

  "user": {
    "id": "user_456",
    "subscription": "premium",
    "account_age_days": 847,
    "lifetime_value_cents": 284700
  },

  "cart": {
    "id": "cart_xyz",
    "item_count": 3,
    "total_cents": 15999,
    "coupon_applied": "SAVE20"
  },

  "payment": {
    "method": "card",
    "provider": "stripe",
    "latency_ms": 1089,
    "attempt": 3
  },

  "error": {
    "type": "PaymentError",
    "code": "card_declined",
    "message": "Card declined by issuer",
    "retriable": false,
    "stripe_decline_code": "insufficient_funds"
  },

  "feature_flags": {
    "new_checkout_flow": true,
    "express_payment": false
  }
}
```

One event. Everything you need. When user complains, search `user_id = "user_456"` and instantly know:
- Premium customer (high priority)
- With you for 2+ years (very high priority)
- Payment failed on 3rd attempt
- Reason: insufficient funds
- Using new checkout flow (potential correlation?)

No grep-ing. No guessing. No second search.

### Field Categories to Include

**Request Context (16 fields)**
- `request_id`, `trace_id`, `span_id`, `parent_span_id`
- `method`, `path`, `query_params`, `status_code`, `duration_ms`
- `timestamp`, `client_ip`, `user_agent`, `content_type`
- `request_size_bytes`, `response_size_bytes`

**User Context (12 fields)**
- `user_id`, `session_id`, `subscription_tier`, `account_age_days`
- `lifetime_value_cents`, `organization_id`, `team_id`, `role`
- `country`, `locale`, `timezone`, `feature_flags`, `ab_test_cohort`

**Business Context (14 fields)**
- `order_id`, `cart_id`, `cart_total_cents`, `item_count`, `item_skus`
- `payment_method`, `payment_provider`, `payment_intent_id`
- `coupon_code`, `discount_cents`, `shipping_method`, `shipping_cents`
- `currency`, `is_gift`

**Infrastructure Context (12 fields)**
- `service_name`, `service_version`, `deployment_id`, `git_sha`
- `region`, `availability_zone`, `host`, `container_id`
- `k8s_namespace`, `k8s_pod`, `cloud_provider`, `environment`

**Error Context (11 fields)**
- `error_type`, `error_code`, `error_message`, `error_retriable`
- `error_stack`, `stripe_decline_code`, `retry_count`, `last_retry_at`
- `upstream_service`, `upstream_latency_ms`

**Performance Context (6 fields)**
- `db_query_count`, `db_query_time_ms`, `cache_hits`, `cache_misses`
- `external_call_count`, `external_call_time_ms`, `memory_used_mb`, `cpu_time_ms`

## Implementation Pattern

Build the event throughout request lifecycle, emit once at the end:

```typescript
// middleware/wideEvent.ts
export function wideEventMiddleware() {
  return async (ctx, next) => {
    const startTime = Date.now();

    // Initialize wide event with request context
    const event: Record<string, unknown> = {
      request_id: ctx.get('requestId'),
      timestamp: new Date().toISOString(),
      method: ctx.req.method,
      path: ctx.req.path,
      service: process.env.SERVICE_NAME,
      version: process.env.SERVICE_VERSION,
      deployment_id: process.env.DEPLOYMENT_ID,
      region: process.env.REGION,
    };

    // Make event accessible to handlers
    ctx.set('wideEvent', event);

    try {
      await next();
      event.status_code = ctx.res.status;
      event.outcome = 'success';
    } catch (error) {
      event.status_code = 500;
      event.outcome = 'error';
      event.error = {
        type: error.name,
        message: error.message,
        code: error.code,
        retriable: error.retriable ?? false,
      };
      throw error;
    } finally {
      event.duration_ms = Date.now() - startTime;
      logger.info(event);  // Emit the wide event
    }
  };
}
```

Enrich in handlers:

```typescript
app.post('/checkout', async (ctx) => {
  const event = ctx.get('wideEvent');
  const user = ctx.get('user');

  // Add user context
  event.user = {
    id: user.id,
    subscription: user.subscription,
    account_age_days: daysSince(user.createdAt),
    lifetime_value_cents: user.ltv,
  };

  // Add business context as you process
  const cart = await getCart(user.id);
  event.cart = {
    id: cart.id,
    item_count: cart.items.length,
    total_cents: cart.total,
    coupon_applied: cart.coupon?.code,
  };

  // Process payment
  const paymentStart = Date.now();
  const payment = await processPayment(cart, user);
  event.payment = {
    method: payment.method,
    provider: payment.provider,
    latency_ms: Date.now() - paymentStart,
    attempt: payment.attemptNumber,
  };

  if (payment.error) {
    event.error = {
      type: 'PaymentError',
      code: payment.error.code,
      stripe_decline_code: payment.error.declineCode,
    };
  }

  return ctx.json({ orderId: payment.orderId });
});
```

## Sampling: Keeping Costs Under Control

At 10,000 RPS with 50 fields/event, costs explode. Use **tail sampling** - decide after request completes.

### Tail Sampling Rules

1. **Always keep errors** - 100% of 500s, exceptions, failures
2. **Always keep slow requests** - Above p99 latency threshold
3. **Always keep specific users** - VIP customers, test accounts, flagged sessions
4. **Randomly sample the rest** - Happy, fast requests? Keep 1-5%

```typescript
function shouldSample(event: WideEvent): boolean {
  // Always keep errors
  if (event.status_code >= 500) return true;
  if (event.error) return true;

  // Always keep slow requests (above p99)
  if (event.duration_ms > 2000) return true;

  // Always keep VIP users
  if (event.user?.subscription === 'enterprise') return true;

  // Always keep requests with debug flags
  if (event.feature_flags?.new_checkout_flow) return true;

  // Random sample the rest at 5%
  return Math.random() < 0.05;
}
```

At 10% random sampling, you have a **90% chance** of missing any specific error. Tail sampling gives you the events that matter.

## Queries You Can Now Run

With wide events, you're not searching text. You're querying structured data:

```sql
-- Error rate by subscription tier
SELECT user.subscription, COUNT(*) as errors
FROM events
WHERE status_code >= 500 AND timestamp > now() - 1h
GROUP BY user.subscription

-- Latency by feature flag
SELECT
  feature_flags.new_checkout_flow,
  percentile(duration_ms, 0.99) as p99
FROM events
WHERE path = '/api/checkout'
GROUP BY feature_flags.new_checkout_flow

-- Payment failures by provider
SELECT payment.provider, error.code, COUNT(*)
FROM events
WHERE error.type = 'PaymentError' AND timestamp > now() - 24h
GROUP BY payment.provider, error.code
ORDER BY COUNT(*) DESC

-- Which deployment caused the regression?
SELECT deployment_id, avg(duration_ms)
FROM events
WHERE path = '/api/checkout' AND timestamp > now() - 6h
GROUP BY deployment_id
ORDER BY avg(duration_ms) DESC
```

## Common Misconceptions

### "Structured logging is the same as wide events"
No. Structured = JSON format. Wide events = one comprehensive event per request with all context. You can have structured logs that are useless (5 fields, no user context, scattered across 20 lines).

### "We already use OpenTelemetry, so we're good"
You're using a delivery mechanism. OTel doesn't decide what to capture. Most implementations capture span name, duration, status. That's not enough.

### "This is just tracing with extra steps"
Tracing = request flow across services. Wide events = context within a service. They're complementary. **Ideally, your wide events ARE your trace spans, enriched with all context.**

### "Logs are for debugging, metrics are for dashboards"
Artificial distinction. Wide events power both. Query for debugging. Aggregate for dashboards. Same data, different views.

### "High-cardinality data is expensive and slow"
On legacy logging systems, yes. Modern columnar databases (ClickHouse, BigQuery) are designed for high-cardinality, high-dimensionality data. Tooling caught up. Your practices should too.

## When to Use This Skill

- **Implementing logging** - Start with wide events from the beginning
- **Reviewing observability code** - Check for business context, field richness
- **Debugging production issues** - Teach patterns that make debugging analytics, not archaeology
- **Evaluating logging infrastructure** - Ensure it supports high-cardinality queries

## Checklist for Wide Events

- [ ] One event per request per service (not scattered log lines)
- [ ] Request context: ID, trace, method, path, status, duration
- [ ] User context: ID, subscription, account age, LTV
- [ ] Business context: Order ID, cart, payment, feature flags
- [ ] Infrastructure context: Service, version, deployment, region
- [ ] Error context: Type, code, message, retriable, upstream service
- [ ] Performance context: DB queries, cache hits, external calls
- [ ] Tail sampling configured (keep errors, slow requests, VIPs)

## Source

Based on [Logging Sucks - Your Logs Are Lying To You](https://loggingsucks.com/) by Boris Tane.
