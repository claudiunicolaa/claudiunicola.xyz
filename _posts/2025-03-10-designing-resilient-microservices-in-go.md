---
title: "Designing Resilient Microservices in Go: Patterns That Work in Production"
date: 2025-03-10
summary: "A deep dive into practical resilience patterns for Go microservices — circuit breakers, retries with backoff, graceful shutdown, and health checks — based on real production experience."
tags:
  - golang
  - microservices
  - cloud-native
  - backend
  - software-architecture
keywords:
  - Go microservices resilience patterns
  - circuit breaker Go
  - graceful shutdown Golang
  - retry with exponential backoff Go
  - health check microservices Go
  - cloud-native backend engineering
og_image: "https://claudiunicola.xyz/profile.jpg"
---

Building microservices that stay up under pressure is harder than it looks. Distributed systems fail in unexpected ways — network blips, dependency outages, resource exhaustion — and your service needs to handle each gracefully without cascading failures.

Here are the patterns I rely on in Go production services.

## 1. Circuit Breakers

A circuit breaker stops calling a downstream service when it's clearly unhealthy, giving it time to recover and protecting your service from long queues of waiting goroutines.

```go
type CircuitBreaker struct {
    mu           sync.Mutex
    failureCount int
    threshold    int
    lastFailure  time.Time
    cooldown     time.Duration
    state        string // "closed", "open", "half-open"
}

func (cb *CircuitBreaker) Allow() bool {
    cb.mu.Lock()
    defer cb.mu.Unlock()

    if cb.state == "open" {
        if time.Since(cb.lastFailure) > cb.cooldown {
            cb.state = "half-open"
            return true
        }
        return false
    }
    return true
}

func (cb *CircuitBreaker) RecordFailure() {
    cb.mu.Lock()
    defer cb.mu.Unlock()

    cb.failureCount++
    cb.lastFailure = time.Now()
    if cb.failureCount >= cb.threshold {
        cb.state = "open"
    }
}

func (cb *CircuitBreaker) RecordSuccess() {
    cb.mu.Lock()
    defer cb.mu.Unlock()

    cb.failureCount = 0
    cb.state = "closed"
}
```

For production use, prefer a battle-tested library like [sony/gobreaker](https://github.com/sony/gobreaker) rather than rolling your own.

## 2. Retry with Exponential Backoff

Never retry immediately — you'll overwhelm an already struggling service. Add jitter to avoid the [thundering herd problem](https://en.wikipedia.org/wiki/Thundering_herd_problem).

```go
func retryWithBackoff(ctx context.Context, maxAttempts int, fn func() error) error {
    base := 100 * time.Millisecond

    for attempt := 0; attempt < maxAttempts; attempt++ {
        err := fn()
        if err == nil {
            return nil
        }

        if attempt == maxAttempts-1 {
            return fmt.Errorf("all %d attempts failed: %w", maxAttempts, err)
        }

        // Exponential backoff with jitter
        backoff := base * time.Duration(1<<attempt)
        jitter := time.Duration(rand.Int63n(int64(backoff) / 2))
        sleep := backoff + jitter

        select {
        case <-ctx.Done():
            return ctx.Err()
        case <-time.After(sleep):
        }
    }
    return nil
}
```

Key details:
- Always pass a `context.Context` so callers can cancel
- Cap the maximum backoff (e.g., 30 seconds)
- Don't retry non-retryable errors (auth failures, bad requests)

## 3. Graceful Shutdown

Abrupt shutdown drops in-flight requests and corrupts background jobs. Go makes graceful shutdown straightforward with `os.Signal` and `context.Context`.

```go
func main() {
    srv := &http.Server{Addr: ":8080", Handler: newRouter()}

    // Start server in background
    go func() {
        if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
            log.Fatalf("listen: %v", err)
        }
    }()

    // Wait for OS signal
    quit := make(chan os.Signal, 1)
    signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
    <-quit

    log.Println("shutting down server...")

    // Allow 30s for in-flight requests to finish
    ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
    defer cancel()

    if err := srv.Shutdown(ctx); err != nil {
        log.Fatalf("forced shutdown: %v", err)
    }

    log.Println("server stopped")
}
```

In Kubernetes, this integrates with `preStop` hooks and `terminationGracePeriodSeconds` to give your pod time to drain traffic before termination.

## 4. Health Check Endpoints

Kubernetes liveness and readiness probes need distinct endpoints with different semantics:

- **`/healthz/live`** — is the process alive? (liveness probe)
- **`/healthz/ready`** — can the process serve traffic? (readiness probe)

```go
// Liveness: basic process health. Fail here = restart the pod.
mux.HandleFunc("/healthz/live", func(w http.ResponseWriter, r *http.Request) {
    w.WriteHeader(http.StatusOK)
    w.Write([]byte(`{"status":"ok"}`))
})

// Readiness: checks dependencies. Fail here = remove from load balancer.
mux.HandleFunc("/healthz/ready", func(w http.ResponseWriter, r *http.Request) {
    if err := db.PingContext(r.Context()); err != nil {
        http.Error(w, `{"status":"not ready","error":"db unreachable"}`, http.StatusServiceUnavailable)
        return
    }
    w.WriteHeader(http.StatusOK)
    w.Write([]byte(`{"status":"ok"}`))
})
```

The key insight: **never** check external dependencies in the liveness probe. If your database is down, you don't want Kubernetes restarting perfectly healthy pods in a loop.

## 5. Context Propagation for Timeout Budgets

Every external call should respect a deadline. Propagate context from the incoming request all the way down.

```go
func (s *OrderService) PlaceOrder(ctx context.Context, order Order) error {
    // Downstream call inherits the caller's deadline
    if err := s.inventoryClient.Reserve(ctx, order.Items); err != nil {
        return fmt.Errorf("inventory reservation failed: %w", err)
    }
    if err := s.paymentClient.Charge(ctx, order.Payment); err != nil {
        return fmt.Errorf("payment failed: %w", err)
    }
    return s.repo.Save(ctx, order)
}
```

Never use `context.Background()` inside a handler — always thread the request context through.

## Putting It All Together

These patterns aren't mutually exclusive; they're layers:

1. **Retry** handles transient errors (brief network blip)
2. **Circuit breaker** handles sustained failures (dependency is down)
3. **Timeouts via context** prevent indefinite waiting
4. **Graceful shutdown** ensures you don't drop work at deployment time
5. **Health checks** let your orchestrator route traffic intelligently

Start simple — add complexity only when you've measured the need. A retry loop and a context deadline take you surprisingly far in most services.

---

*Have questions or a pattern I missed? Feel free to reach out via [LinkedIn](https://www.linkedin.com/in/claudiunicola/).*
