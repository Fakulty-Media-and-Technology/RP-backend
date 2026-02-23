# DevOps Changes: RTMP Streaming Infrastructure

## Overview

This document outlines the changes made to implement production-ready RTMP live streaming using `tiangolo/nginx-rtmp` Docker image instead of the built-in Node Media Server (NMS). This approach is more reliable, performant, and battle-tested for production deployments.

**Domain:** `reeplay.app`

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        obs.reeplay.app                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   ┌─────────────────┐         ┌─────────────────┐                  │
│   │   OBS Studio    │  RTMP   │   nginx-rtmp    │                  │
│   │   (Streamer)    │────────▶│   Container     │                  │
│   └─────────────────┘  :1935  │                 │                  │
│                               │  ┌───────────┐  │                  │
│                               │  │ FFmpeg    │  │  on_publish      │
│                               │  │ Transcode │  │────────────────┐ │
│                               │  └───────────┘  │                │ │
│                               │        │        │                │ │
│                               │        ▼        │                ▼ │
│   ┌─────────────────┐   HLS   │  ┌───────────┐  │  ┌─────────────┐ │
│   │   Video Player  │◀────────│  │ HLS Files │  │  │  reeplay    │ │
│   │   (Viewers)     │  :8080  │  │ /tmp/hls  │  │  │  Node.js    │ │
│   └─────────────────┘         │  └───────────┘  │  │  API        │ │
│                               └─────────────────┘  └─────────────┘ │
│                                                           │        │
│                                                           ▼        │
│                                                    ┌─────────────┐ │
│                                                    │  MongoDB    │ │
│                                                    └─────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Files Changed

### 1. `Dockerfile.nginx-rtmp` (NEW FILE)


**Purpose:** Creates a dedicated Docker image for nginx-rtmp streaming server based on the production-tested `tiangolo/nginx-rtmp` image.

**Why:**
- `tiangolo/nginx-rtmp` is a well-maintained, production-ready RTMP server
- Separates streaming concerns from the main Node.js application
- Includes nginx compiled with the nginx-rtmp-module
- More stable and performant than Node Media Server for production

**Key sections:**
- **Line 5:** Base image `tiangolo/nginx-rtmp:latest`
- **Lines 8-11:** Install ffmpeg for multi-bitrate transcoding
- **Line 14:** Create HLS output directory
- **Line 17:** Copy custom nginx configuration
- **Lines 22-23:** Expose RTMP (1935) and HLS HTTP (8080) ports
- **Lines 26-27:** Health check endpoint

---

### 2. `docker/nginx.conf` (MODIFIED)

**Location:** `/docker/nginx.conf`  
**Lines:** 1-145

**Purpose:** Complete nginx configuration for RTMP ingest, HLS output, and authentication callbacks.

**Why:**
- Replaces simple HTTP proxy config with full RTMP streaming capability
- Enables adaptive bitrate streaming (360p, 480p, 720p)
- Implements authentication via callbacks to validate stream keys
- Domain configured for `obs.reeplay.app`

**Key sections:**

| Lines | Section | Purpose |
|-------|---------|---------|
| 1-2 | Worker config | Auto-scale workers, enable RTMP auto-push |
| 4-6 | Comments | Document streaming URLs |
| 12-76 | RTMP block | RTMP server configuration |
| 14-15 | Listen | RTMP port 1935 (IPv4 + IPv6) |
| 22-24 | Application live | Main streaming application |
| 27-29 | **Callbacks** | Authentication - validates stream keys via API |
| 32-36 | HLS config | 3-second fragments, 60s playlist |
| 40-46 | 360p transcode | FFmpeg command for 360p variant |
| 49-55 | 480p transcode | FFmpeg command for 480p variant |
| 58-64 | 720p transcode | FFmpeg command for 720p variant |
| 67-76 | HLS application | Secondary app for transcoded streams |
| 79-103 | HTTP block | HTTP server for HLS delivery |
| 106 | Server name | `obs.reeplay.app localhost` |
| 113-120 | /hls location | Serve HLS m3u8 and .ts files |
| 123-128 | /stat location | RTMP statistics (monitoring) |
| 134-137 | /health | Health check endpoint |

**Authentication Callbacks (Lines 27-29):**
```nginx
on_publish https://reeplay.app/api/v1/on_publish;
on_publish_done https://reeplay.app/api/v1/webhooks/rtmp/on_publish_done;
on_play https://reeplay.app/api/v1/webhooks/rtmp/on_play;
```

---

### 3. `src/controllers/webhooks/rtmp.webhook.controller.ts` (NEW FILE)

**Location:** `/src/controllers/webhooks/rtmp.webhook.controller.ts`  
**Lines:** 1-74

**Purpose:** Handles nginx-rtmp callback requests for stream authentication and lifecycle events.

**Why:**
- nginx-rtmp uses HTTP callbacks to validate streams
- Return HTTP 2xx to allow stream, 4xx/5xx to reject
- Enables stream key validation against database
- Tracks when streams start/end

**Key sections:**

| Lines | Method | Purpose |
|-------|--------|---------|
| 21-38 | `onPublishDone` | Called when stream ends - updates `isLive: false` in database |
| 44-70 | `onPlay` | Called when viewer connects - validates stream exists and not expired |

**Note:** The `on_publish` callback uses the existing `LivestreamController.handleRTMPLivestreamOnPublish` at `/api/v1/on_publish`.

---

### 4. `src/routes/webhooksRoutes/index.ts` (MODIFIED)

**Location:** `/src/routes/webhooksRoutes/index.ts`  
**Lines:** 1-13

**Purpose:** Added routes for nginx-rtmp callbacks.

**Changes:**
- **Line 3:** Import `RTMPWebhooksController`
- **Line 12:** Route for `on_publish_done` callback
- **Line 13:** Route for `on_play` callback

```typescript
// RTMP/nginx-rtmp callbacks
webhooksRouter.post('/rtmp/on_publish_done', RTMPWebhooksController.onPublishDone)
webhooksRouter.post('/rtmp/on_play', RTMPWebhooksController.onPlay)
```

---

### 5. `src/index.ts` (MODIFIED)

**Location:** `/src/index.ts`  
**Lines:** 17-23, 44-50, 81-83

**Purpose:** Made Node Media Server optional so it can be disabled when using nginx-rtmp.

**Changes:**

| Lines | Change | Purpose |
|-------|--------|---------|
| 17-19 | Added `USE_NMS` env check | Control whether to use built-in NMS or external nginx-rtmp |
| 22 | Conditional `mediaStream` | Only instantiate NMS if `USE_NMS=true` |
| 44-50 | Conditional startup | Only start NMS if enabled, otherwise log nginx-rtmp mode |
| 81-83 | Conditional shutdown | Only close NMS if it was started |

**Environment Variable:**
```bash
USE_NMS=false  # Use nginx-rtmp (production)
USE_NMS=true   # Use Node Media Server (development/fallback)
```

---


## Authentication Flow

```
1. Streamer connects to rtmp://obs.reeplay.app:1935/live/abc123
                              │
                              ▼
2. nginx-rtmp sends POST to https://reeplay.app/api/v1/on_publish
   Body: { name: "abc123", addr: "192.168.1.1", app: "live" }
                              │
                              ▼
3. Node.js validates stream_key against LiveModel in MongoDB
                              │
            ┌─────────────────┴─────────────────┐
            ▼                                   ▼
   HTTP 200 (Valid)                    HTTP 403 (Invalid)
   Stream accepted                     Stream rejected
            │
            ▼
4. FFmpeg transcodes to 360p/480p/720p
            │
            ▼
5. HLS segments written to /tmp/hls/{stream_key}/
            │
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
