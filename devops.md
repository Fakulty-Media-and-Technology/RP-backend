# DevOps Changes: RTMP Streaming Infrastructure

## Overview

This document outlines the changes made to implement production-ready RTMP live streaming using `tiangolo/nginx-rtmp` Docker image instead of the built-in Node Media Server (NMS). This approach is more reliable, performant, and battle-tested for production deployments.

**Domain:** `obs.reeplay.app`

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        obs.reeplay.app                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   ┌─────────────────┐         ┌─────────────────────────────────┐  │
│   │   OBS Studio    │  RTMP   │   nginx-rtmp + Node.js          │  │
│   │   (Streamer)    │────────▶│   Container                     │  │
│   └─────────────────┘  :1935  │                                 │  │
│                               │  ┌───────────┐  ┌─────────────┐ │  │
│                               │  │ FFmpeg    │  │  Node.js    │ │  │
│                               │  │ Transcode │  │  API :3000  │ │  │
│                               │  └───────────┘  └─────────────┘ │  │
│                               │        │               │        │  │
│                               │        ▼               ▼        │  │
│   ┌─────────────────┐   HLS   │  ┌───────────┐  ┌─────────────┐ │  │
│   │   Video Player  │◀────────│  │ HLS Files │  │  MongoDB    │ │  │
│   │   (Viewers)     │  :8080  │  │ /tmp/hls  │  │  (external) │ │  │
│   └─────────────────┘         │  └───────────┘  └─────────────┘ │  │
│                               └─────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Files Changed

### 1. `Dockerfile.nginx-rtmp` (NEW FILE)

**Purpose:** Creates a combined Docker image with nginx-rtmp + Node.js based on `tiangolo/nginx-rtmp`.

**Why:**
- `tiangolo/nginx-rtmp` is a well-maintained, production-ready RTMP server
- Combined container runs both nginx-rtmp and Node.js app
- Includes nginx compiled with the nginx-rtmp-module
- More stable and performant than Node Media Server for production

**Key sections:**
- Base image: `tiangolo/nginx-rtmp:latest`
- Installs Node.js 20 + ffmpeg
- Copies and builds Node.js application
- Creates startup script to run both services
- Exposes ports: 3000 (API), 1935 (RTMP), 8080 (HLS)

---

### 2. `docker/nginx.conf` (MODIFIED)

**Purpose:** Complete nginx configuration for RTMP ingest and HLS output.

**Why:**
- Replaces simple HTTP proxy config with full RTMP streaming capability
- Enables adaptive bitrate streaming (360p, 480p, 720p)
- Domain configured for `obs.reeplay.app`

**Key sections:**

| Section | Purpose |
|---------|---------|
| RTMP block | RTMP server on port 1935 |
| Application live | Main streaming application |
| HLS config | 3-second fragments, 60s playlist |
| FFmpeg exec_push | Transcode to 360p, 480p, 720p variants |
| HTTP server | Serve HLS files on port 8080 |
| /hls location | Serve m3u8 and .ts files |
| /stat location | RTMP statistics (monitoring) |
| /health | Health check endpoint |

---

### 3. `src/index.ts` (MODIFIED)

**Purpose:** Made Node Media Server optional so it can be disabled when using nginx-rtmp.

**Changes:**
- Added `USE_NMS` environment variable check
- Conditional instantiation of MediaStream
- Conditional startup/shutdown of NMS

**Environment Variable:**
```bash
USE_NMS=false  # Use nginx-rtmp (production)
USE_NMS=true   # Use Node Media Server (development/fallback)
```

---

## Streaming URLs

| Purpose | URL |
|---------|-----|
| **RTMP Ingest (OBS)** | `rtmp://obs.reeplay.app:1935/live/{stream_key}` |
| **HLS Playback** | `http://obs.reeplay.app:8080/hls/{stream_key}/index.m3u8` |
| **Stats/Monitoring** | `http://obs.reeplay.app:8080/stat` |
| **Health Check** | `http://obs.reeplay.app:8080/health` |
| **Node.js API** | `http://obs.reeplay.app:3000` |

---

## Deployment Checklist

- [ ] Build image: `docker build -f Dockerfile.nginx-rtmp -t reeplay-rtmp .`
- [ ] Set `USE_NMS=false` in environment
- [ ] Configure DNS: `obs.reeplay.app` → server IP
- [ ] Open firewall ports: 1935 (RTMP), 8080 (HLS), 3000 (API)
- [ ] Test stream with OBS Studio
- [ ] Verify HLS playback in browser

---

## Rollback

To revert to Node Media Server:

1. Set `USE_NMS=true` in environment
2. Use original `Dockerfile` instead of `Dockerfile.nginx-rtmp`
3. Restart container

---

## References

- [tiangolo/nginx-rtmp Docker Hub](https://hub.docker.com/r/tiangolo/nginx-rtmp/)
- [nginx-rtmp-module Documentation](https://github.com/arut/nginx-rtmp-module/wiki/Directives)
- [OBS Studio Streaming Guide](https://obsproject.com/)
            ▼
6. Viewers access via http://obs.reeplay.app:8080/hls/{stream_key}/index.m3u8
            │
            ▼
7. When stream ends, POST to /api/v1/webhooks/rtmp/on_publish_done
   Updates isLive: false in database
```


---

## Rollback

To revert to Node Media Server:

1. Set `USE_NMS=true` in environment
2. Remove nginx-rtmp service from docker-compose.yml
3. Restart reeplay container

---
