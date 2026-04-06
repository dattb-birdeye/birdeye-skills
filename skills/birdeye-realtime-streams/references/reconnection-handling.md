# Realtime Streams — Reconnection Handling

WebSocket connections will drop (maintenance, network interruptions, idle timeout). **Always implement auto-reconnection.**

## Reconnection Rules

1. **Exponential backoff** — start at 1s, double each attempt, cap at 30s. Reset to 1s on successful connect.
2. **Store all subscriptions** — re-send every subscription message immediately on reconnect.
3. **Ping keepalive** — send a ping every 30s; if not acknowledged, close and reconnect.
4. **Don't reconnect on intentional close** — track whether close was user-initiated.
5. **Reconnect on `close` event, not `error`** — `error` always fires before `close`; handling both causes duplicate reconnections.

## Gap Recovery

Data received between disconnect and reconnect is lost. After reconnect:
- Re-subscribe to all channels first
- Use REST API to backfill the gap (e.g., `GET /defi/v3/ohlcv` with `time_from=lastReceivedTimestamp&time_to=now`)

## Common Mistakes

- Not implementing ping keepalive — connection drops silently
- Not storing subscriptions — all subscriptions lost on reconnect
- Reconnecting on `error` instead of `close` — duplicate reconnections
- No backoff — hammers server during outages
- Ignoring the data gap on reconnect
