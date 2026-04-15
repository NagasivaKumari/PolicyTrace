import time
from collections import defaultdict, deque
from threading import Lock

from fastapi import HTTPException, Request, status
import redis

from ..config import settings


_requests: dict[str, deque[float]] = defaultdict(deque)
_lock = Lock()
_redis_client = None
_redis_checked = False


def _get_client_ip(request: Request) -> str:
    if settings.TRUST_PROXY_HEADERS:
        forwarded_for = request.headers.get("x-forwarded-for", "").split(",")[0].strip()
        if forwarded_for:
            return forwarded_for
    return request.client.host if request.client else "unknown"


def _get_redis_client():
    global _redis_client, _redis_checked
    if _redis_checked:
        return _redis_client
    _redis_checked = True
    if not settings.RATE_LIMIT_USE_REDIS:
        return None
    try:
        client = redis.Redis.from_url(settings.REDIS_URL, decode_responses=True, socket_connect_timeout=1)
        client.ping()
        _redis_client = client
    except Exception:
        _redis_client = None
    return _redis_client


def rate_limit(max_requests: int, window_seconds: int):
    async def _dependency(request: Request) -> None:
        client_ip = _get_client_ip(request)
        key = f"{request.url.path}:{client_ip}"
        redis_client = _get_redis_client()

        if redis_client is not None:
            redis_key = f"rl:{key}"
            try:
                count = redis_client.incr(redis_key)
                if count == 1:
                    redis_client.expire(redis_key, window_seconds)
                if count > max_requests:
                    raise HTTPException(
                        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                        detail="Rate limit exceeded. Please retry shortly.",
                    )
                return
            except HTTPException:
                raise
            except Exception:
                # Fall back to in-memory limiter on transient Redis errors.
                pass

        now = time.time()
        window_start = now - window_seconds

        with _lock:
            bucket = _requests[key]
            while bucket and bucket[0] < window_start:
                bucket.popleft()

            if len(bucket) >= max_requests:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Rate limit exceeded. Please retry shortly.",
                )
            bucket.append(now)

    return _dependency
