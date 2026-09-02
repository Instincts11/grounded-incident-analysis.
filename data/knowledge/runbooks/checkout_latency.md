# Checkout service latency runbook

If checkout-service shows sustained latency_spike, verify upstream database saturation and thread pool exhaustion first.

## Mitigation

Mitigation order: 1. Scale checkout-service pods. 2. Reduce expensive read paths. 3. Apply cache warmup for product and pricing lookups.
