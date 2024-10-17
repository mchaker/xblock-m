# XBlock via Docker Compose

This is a more dev-friendly version of the XBlock firehose consumer. I've set it up to work with Docker Compose to be more accessible.

It uses Redis (via BullMQ) to manage a LIFO queue.

```bash
docker build -t aendra/xblock:latest .

docker-compose up
```
