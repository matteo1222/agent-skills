---
name: wide-events
description: Implement wide events (canonical log lines) for observability - one rich structured event per request instead of log spam.
---

# Wide Events / Canonical Log Lines

Replace scattered log statements with one context-rich event per request per service.

## The Problem

Traditional logging:
```typescript
logger.info('Request received', { path: '/checkout' });
logger.debug('User authenticated', { userId: 'user_123' });
logger.info('Cart loaded', { items: 3 });
logger.debug('Payment started');
logger.warn('Payment slow', { latency: 1200 });
logger.error('Payment failed', { error: 'declined' });
```

That's 6 log lines for one request. At 10k concurrent users = 60k+ lines/sec. When debugging:
- String search treats logs as bags of characters
- No correlation across services
- Missing context when you need it most

## The Solution

One wide event per request with 30-50+ fields:

```typescript
{
  "timestamp": "2025-01-15T10:23:45.612Z",
  "request_id": "req_8bf7ec2d",
  "trace_id": "abc123",
  "service": "checkout-service",
  "method": "POST",
  "path": "/api/checkout",
  "status_code": 500,
  "duration_ms": 1247,
  "user": {
    "id": "user_456",
    "subscription": "premium",
    "account_age_days": 847
  },
  "cart": {
    "id": "cart_xyz",
    "item_count": 3,
    "total_cents": 15999
  },
  "payment": {
    "provider": "stripe",
    "latency_ms": 1089,
    "attempt": 3
  },
  "error": {
    "type": "PaymentError",
    "code": "card_declined",
    "message": "insufficient_funds"
  },
  "feature_flags": {
    "new_checkout_flow": true
  }
}
```

## Implementation Pattern

### 1. Middleware: Initialize + Emit

```typescript
// middleware/wideEvent.ts
import { Context, Next } from 'hono';

export type WideEvent = Record<string, unknown>;

export function wideEventMiddleware() {
  return async (c: Context, next: Next) => {
    const startTime = Date.now();
    
    // Initialize with request context
    const event: WideEvent = {
      request_id: c.get('requestId') || crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      method: c.req.method,
      path: c.req.path,
      service: process.env.SERVICE_NAME,
      version: process.env.SERVICE_VERSION,
    };
    
    // Make accessible to handlers
    c.set('wideEvent', event);
    
    try {
      await next();
      event.status_code = c.res.status;
      event.outcome = 'success';
    } catch (error) {
      event.status_code = 500;
      event.outcome = 'error';
      event.error = {
        type: error.name,
        message: error.message,
        code: error.code,
        stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined,
      };
      throw error;
    } finally {
      event.duration_ms = Date.now() - startTime;
      // ONE log emit per request
      logger.info(event);
    }
  };
}
```

### 2. Handlers: Enrich with Business Context

```typescript
app.post('/checkout', async (c) => {
  const event = c.get('wideEvent') as WideEvent;
  const user = c.get('user');
  
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
  
  // Add payment context
  const paymentStart = Date.now();
  try {
    const result = await processPayment(cart);
    event.payment = {
      provider: 'stripe',
      latency_ms: Date.now() - paymentStart,
      success: true,
    };
  } catch (err) {
    event.payment = {
      provider: 'stripe',
      latency_ms: Date.now() - paymentStart,
      success: false,
      decline_code: err.decline_code,
    };
    throw err;
  }
  
  return c.json({ success: true });
});
```

### 3. Helper for Nested Timing

```typescript
// Track sub-operations
function trackOperation(event: WideEvent, name: string) {
  const start = Date.now();
  return {
    success: (extra?: Record<string, unknown>) => {
      event[name] = { duration_ms: Date.now() - start, success: true, ...extra };
    },
    failure: (error: Error, extra?: Record<string, unknown>) => {
      event[name] = { 
        duration_ms: Date.now() - start, 
        success: false, 
        error: error.message,
        ...extra 
      };
    },
  };
}

// Usage
const dbOp = trackOperation(event, 'db_query');
try {
  const result = await db.query(sql);
  dbOp.success({ rows: result.length });
} catch (err) {
  dbOp.failure(err);
  throw err;
}
```

## What to Include

### Always Include
- `request_id` / `trace_id` - correlation
- `timestamp` - when
- `service`, `version` - where
- `method`, `path`, `status_code` - what
- `duration_ms` - how long
- `outcome` - success/error

### User Context
- `user.id`
- `user.subscription` / `user.plan`
- `user.account_age_days`
- `user.lifetime_value`

### Business Context
- Entity IDs (order_id, cart_id, etc.)
- Counts (item_count, retry_attempt)
- Amounts (total_cents, discount_applied)
- Feature flags enabled

### Error Context
- `error.type` - class name
- `error.code` - machine-readable
- `error.message` - human-readable
- `error.retriable` - can retry?

### Performance Context
- Sub-operation latencies (db_ms, cache_ms, external_api_ms)
- Cache hit/miss
- Query counts

## Sampling for Cost Control

Don't sample randomly. Use tail sampling:

```typescript
function shouldSample(event: WideEvent): boolean {
  // Always keep errors
  if (event.outcome === 'error') return true;
  
  // Always keep slow requests (>p99)
  if (event.duration_ms > 2000) return true;
  
  // Always keep premium users
  if (event.user?.subscription === 'premium') return true;
  
  // Sample 10% of successful requests
  return Math.random() < 0.1;
}
```

## Querying Wide Events

With wide events, you query structured data:

```sql
-- Find all failed checkouts for premium users this week
SELECT * FROM events 
WHERE path = '/api/checkout' 
  AND outcome = 'error'
  AND user.subscription = 'premium'
  AND timestamp > now() - interval '7 days';

-- P99 latency by endpoint
SELECT path, percentile_cont(0.99) WITHIN GROUP (ORDER BY duration_ms)
FROM events
GROUP BY path;

-- Correlation: new checkout flow vs payment failures
SELECT 
  feature_flags.new_checkout_flow,
  COUNT(*) FILTER (WHERE payment.success = false) as failures,
  COUNT(*) as total
FROM events
WHERE path = '/api/checkout'
GROUP BY feature_flags.new_checkout_flow;
```

## Anti-Patterns

### ❌ Don't: Log spam
```typescript
logger.info('Starting checkout');
logger.debug('Loading cart');
logger.info('Cart loaded');
logger.debug('Processing payment');
// ... 10 more lines
```

### ✅ Do: Build context, emit once
```typescript
event.cart = { ... };
event.payment = { ... };
// Middleware emits at end
```

### ❌ Don't: Log without context
```typescript
logger.error('Payment failed');
```

### ✅ Do: Include everything needed to debug
```typescript
event.error = {
  type: 'PaymentError',
  code: err.decline_code,
  message: err.message,
  stripe_request_id: err.requestId,
};
event.payment = {
  attempt: retryCount,
  amount_cents: cart.total,
  card_last4: card.last4,
};
```

### ❌ Don't: Rely on string search
```typescript
logger.info(`Payment failed for user ${userId}`);
// Later: grep "user_123" -> misses "userId: user_123"
```

### ✅ Do: Structured fields
```typescript
event.user = { id: userId };
// Later: SELECT * WHERE user.id = 'user_123'
```

## Migration Path

1. **Add request ID threading** (you have this)
2. **Add wide event middleware** - initialize/emit
3. **Enrich one endpoint** - pick your most debugged endpoint
4. **Remove old logs** - as wide events prove useful
5. **Expand** - add more endpoints, more context

## Source

Based on [Logging Sucks](https://loggingsucks.com/) by Boris Tane.

See also: Stripe's canonical log lines, Honeycomb's wide events documentation.
