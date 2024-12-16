# XBlock via Docker Compose

This is a more dev-friendly version of the XBlock firehose consumer. I've set it up to work with Docker Compose to be more accessible.

It uses Redis (via BullMQ) to manage a LIFO queue.

```bash
./build-firehose-docker.sh
./build-worker-gpu-docker.sh

docker compose up
```
