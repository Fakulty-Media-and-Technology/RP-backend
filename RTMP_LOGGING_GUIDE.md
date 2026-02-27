# RTMP & HLS Logging Setup Guide

## Overview

Your nginx-rtmp config now logs:

- **RTMP Streaming**: When users connect to stream (publish), disconnect, and when streams are played
- **HLS Pulling**: When users pull HLS content with client IP and stream information

## Log Files Created

### 1. RTMP Stream Events

**Location**: `/var/log/nginx/rtmp-stream.log`

Logs when:

- User starts streaming to RTMP (PUBLISH)
- User stops streaming (DONE)
- User starts playing a stream (PLAY)

Example output:

```
[Mon Feb 26 10:15:30 UTC 2026] [RTMP PUBLISH] Stream started: mystream from 192.168.1.100
[Mon Feb 26 10:15:35 UTC 2026] [RTMP PLAY] Stream being played: mystream from 192.168.1.101
[Mon Feb 26 10:20:30 UTC 2026] [RTMP DONE] Stream ended: mystream
```

### 2. HLS Pull Logs

**Location**: `/var/log/nginx/hls-access.log`

Logs HLS segment/playlist requests with client IP and bandwidth info.

Example output:

```
[HLS] 2026-02-26T10:15:30+00:00 | Client: 192.168.1.101 | Stream: /hls/mystream/index.m3u8 | Status: 200 | Size: 2048 bytes
[HLS] 2026-02-26T10:15:33+00:00 | Client: 192.168.1.101 | Stream: /hls/mystream/0.ts | Status: 200 | Size: 512000 bytes
```

## How to View Logs

### Option 1: Inside Docker Container

```bash
# Tail RTMP logs
docker exec -it <container_name> tail -f /var/log/nginx/rtmp-stream.log

# Tail HLS logs
docker exec -it <container_name> tail -f /var/log/nginx/hls-access.log

# Watch both simultaneously
docker exec -it <container_name> tail -f /var/log/nginx/rtmp-stream.log /var/log/nginx/hls-access.log
```

### Option 2: Using the Monitoring Script

```bash
# If logs are mounted to your host:
chmod +x docker/monitor-streams.sh
./docker/monitor-streams.sh
```

### Option 3: Docker Logs

```bash
# View realtime container logs (if using docker logs)
docker logs -f <container_name>
```

## Suggested Dockerfile Update

Add this to your Dockerfile to ensure logs are viewable:

```dockerfile
# Create log directory
RUN mkdir -p /var/log/nginx
RUN touch /var/log/nginx/rtmp-stream.log /var/log/nginx/hls-access.log

# Optional: Mount volumes in docker-compose.yml for persistent logs
```

## Docker Compose Volume Mapping (Optional)

To persist logs on your host machine, add to your `docker-compose.yml`:

```yaml
services:
  rtmp:
    volumes:
      - ./logs/rtmp:/var/log/nginx/rtmp-stream.log
      - ./logs/hls:/var/log/nginx/hls-access.log
```

Then create the logs directory:

```bash
mkdir -p logs/rtmp logs/hls
```

## What Information You Get

✅ **RTMP Streaming Section Shows**:

- Timestamp of event
- Event type (PUBLISH/DONE/PLAY)
- Stream name (stream key)
- Client IP address

✅ **HLS Pulling Section Shows**:

- Timestamp of request
- Client IP
- Which file was requested (playlist or video segment)
- HTTP status (200 = success)
- File size transferred

## Testing

1. Start your RTMP container
2. Stream to it: `ffmpeg -re -i input.mp4 -c copy -f flv rtmp://localhost/live/teststream`
3. Pull HLS in another terminal: `ffplay http://localhost:8080/hls/teststream/index.m3u8`
4. View logs as described above - you'll see entries appear in real-time

## Notes

- No main codebase modifications needed ✓
- Simple bash logging using `exec` and `echo`
- Logs are separate from nginx access logs to keep them clean
- Stream names and client IPs are captured automatically
