# RTMP/HLS Troubleshooting Guide

This guide helps you diagnose issues with RTMP streaming and HLS pulling using the enhanced logging system.

## Log Files & What They Track

### 1. RTMP Stream Events (`/var/log/nginx/rtmp-stream.log`)
Tracks all streaming activity:
- **[RTMP PUBLISH]** - User started streaming ✓ GOOD
- **[RTMP DONE]** - User stopped streaming ✓ GOOD  
- **[HLS PLAY]** - User started pulling stream ✓ GOOD
- **[HLS STOP]** - User stopped pulling ✓ GOOD

### 2. HLS Access Log (`/var/log/nginx/hls-access.log`)
Tracks all HLS requests with response times:
- Status 200 = Successful request ✓ GOOD
- Status 404 = Stream/segment not found ✗ ISSUE
- Status 500 = Server error ✗ ISSUE
- High request times = Bandwidth/performance issue ⚠️

### 3. Error Logs (`/var/log/nginx/hls-error.log`)
Captures all errors and warnings:
- Connection drops
- Timeout issues
- HLS generation failures
- Permission issues

---

## Common Issues & Solutions

### Issue 1: Streamers Can Connect But Stream Not Appearing
```
Log shows: [RTMP PUBLISH] ✓ but [HLS PLAY] ✗ missing
```

**Diagnosis:**
```bash
# Check HLS directory has content
docker exec <container> ls -la /tmp/hls/

# Check HLS error log
docker exec <container> tail -50 /var/log/nginx/hls-error.log
```

**Solutions:**
- Verify HLS path exists: `mkdir -p /tmp/hls`
- Check disk space: `docker exec <container> df -h /tmp`
- Verify nginx HLS permissions

---

### Issue 2: HLS Players Getting 404 Errors
```
Log shows: Status: 404 | Stream: /hls/mystream/index.m3u8
```

**Diagnosis:**
```bash
# Check if stream is actively being broadcast
docker exec <container> tail -20 /var/log/nginx/rtmp-stream.log | grep "RTMP PUBLISH"

# Check HLS segment existence
docker exec <container> ls -la /tmp/hls/mystream/
```

**Solutions:**
- **Stream not running**: Ensure broadcaster is connected to `rtmp://server/live/mystream`
- **Wrong stream name**: Double-check the stream key matches in logs
- **HLS not generating**: Check error log for HLS segment generation errors

---

### Issue 3: Slow/Buffering HLS Playback
```
Log shows: High response times (request_time > 1s)
Status: 200 but Size: very large or inconsistent
```

**Diagnosis:**
```bash
# Check HLS segment sizes (should be consistent)
docker exec <container> ls -lh /tmp/hls/mystream/*.ts 2>/dev/null | head -20

# Check for errors during generation
docker exec <container> grep "hls" /var/log/nginx/hls-error.log | tail -20

# Check system resources
docker stats <container>
```

**Solutions:**
- **Increase HLS fragment size** in nginx-rtmp.conf:
  ```nginx
  hls_fragment 5s;  # Change from 3s
  hls_playlist_length 60s;  # Increase buffer
  ```
- **Check encoder bitrate**: Ensure RTMP stream bitrate is appropriate
- **Network bandwidth**: Monitor between streamer and server
- **Server CPU/Memory**: Check available resources

---

### Issue 4: RTMP Connection Drops (Timeout)
```
Log shows: [RTMP PUBLISH] ✓ then nothing, no [RTMP DONE]
Error shows: "connection reset by peer" or "timeout"
```

**Diagnosis:**
```bash
# Check timeout setting
grep "timeout" /etc/nginx/nginx-rtmp.conf

# Monitor active connections
docker exec <container> netstat -a | grep 1936 | wc -l

# Check system limits
docker exec <container> ulimit -n  # Should be >= 1024
```

**Solutions:**
- **Increase timeout**: In application block set `timeout 60s;` (from 30s)
- **Check network stability**: Use `ping` or `mtr` to diagnose path
- **Encoder settings**: Ensure encoder keeps-alive is enabled
- **Firewall/NAT**: Check if ISP/firewall is dropping idle connections

---

### Issue 5: HLS Pulling Connection Drops
```
Log shows: [HLS PLAY] ✓ then long silence, errors in hls-error.log
```

**Diagnosis:**
```bash
# Check keepalive settings
grep "keepalive" /etc/nginx/nginx-rtmp.conf

# Check for permission errors
docker exec <container> tail -50 /var/log/nginx/hls-error.log | grep -i permission

# Check segment availability
docker exec <container> ls -la /tmp/hls/mystream/ | wc -l
```

**Solutions:**
- **Increase keepalive timeout**: `keepalive_timeout 120;` (from 65)
- **HLS cleanup too aggressive**: Check `hls_cleanup on` might be deleting segments too fast
  - Try: `hls_cleanup off;` temporarily for testing
- **Verify HLS segments generating**: Should have `.m3u8` and `.ts` files

---

### Issue 6: "No Active Stream" When Pulling HLS
```
Log shows: [HLS PLAY] ✓ but HLS error log shows "file not found"
Client error: "Bad playlist" or "no segments"
```

**Diagnosis:**
```bash
# Verify stream publishing
docker exec <container> curl -s http://localhost:8080/stat | grep "live"

# Check HLS directory content
docker exec <container> find /tmp/hls -type f | head -10

# Verify manifest file
docker exec <container> cat /tmp/hls/mystream/index.m3u8
```

**Solutions:**
- **Wait for segments**: HLS needs 2-3 segments before playable (30+ seconds of broadcast)
- **Check stream key**: Must match exactly: `rtmp://server/live/{KEY}` and `http://server/hls/{KEY}/index.m3u8`
- **Verify HLS generation**: May need time to generate first segments

---

## Real-Time Monitoring Commands

### Quick Stats
```bash
# All current active streams
docker exec <container> tail -20 /var/log/nginx/rtmp-stream.log | grep PUBLISH

# Recent errors
docker exec <container> tail -50 /var/log/nginx/hls-error.log

# HLS requests in last minute
docker exec <container> tail -100 /var/log/nginx/hls-access.log | wc -l

# Count current viewers
docker exec <container> tail -20 /var/log/nginx/rtmp-stream.log | grep "HLS PLAY" | wc -l
```

### Watch in Real-Time
```bash
# Follow RTMP events only
docker exec <container> tail -f /var/log/nginx/rtmp-stream.log

# Follow HLS requests only (with timeout info)
docker exec <container> tail -f /var/log/nginx/hls-access.log

# Follow errors only
docker exec <container> tail -f /var/log/nginx/hls-error.log
```

---

## Performance Indicators to Watch

| Metric | Healthy | Warning | Critical |
|--------|---------|---------|----------|
| RTMP Publish Success | ✓ Appears in log | Delayed | Fails |
| HLS Segment Time | < 0.5s | 0.5-2s | > 2s |
| HLS Player Latency | 10-20s | 20-45s | > 45s |
| Server CPU | < 60% | 60-80% | > 80% |
| 404 Errors | 0/hour | Few | Many |
| Timeout Errors | 0 | Few | Frequent |

---

## Log Analysis Shell Scripts

### See all active broadcasts
```bash
docker exec <container> bash -c 'grep "RTMP PUBLISH" /var/log/nginx/rtmp-stream.log | tail -10'
```

### Count unique viewers
```bash
docker exec <container> bash -c 'grep "HLS PLAY" /var/log/nginx/rtmp-stream.log | cut -d"|" -f2 | sort | uniq | wc -l'
```

### Find slow requests
```bash
docker exec <container> bash -c 'grep "HLS" /var/log/nginx/hls-access.log | awk -F"Time: " "{print \$2}" | sort -rn | head -5'
```

### Get error frequency
```bash
docker exec <container> bash -c 'grep -c "error\|Error\|ERROR" /var/log/nginx/hls-error.log'
```

---

## When to Check Logs

✓ **Always check logs if:**
- Viewers report buffering or black screens
- Streamers say "connection failed"
- HLS players return errors
- Streams suddenly stop
- Performance is degraded

✓ **Proactively monitor:**
- After enabling new features
- When switching bitrates/encoding
- Peak traffic times
- After config changes

---

## Accessing Logs on Host

If you mount logs as volumes in docker-compose:
```yaml
volumes:
  - ./logs/rtmp:/var/log/nginx/rtmp-stream.log
  - ./logs/hls:/var/log/nginx/hls-access.log
  - ./logs/errors:/var/log/nginx/hls-error.log
```

Then access directly:
```bash
tail -f logs/rtmp
tail -f logs/hls
tail -f logs/errors
```

---

## Further Debugging

### Enable Debug Logging (More Verbose)
In nginx-rtmp.conf:
```nginx
error_log /var/log/nginx/error.log debug;  # More detailed
```

### Check Nginx Config Validity
```bash
docker exec <container> nginx -t
```

### View Nginx Status
```bash
docker exec <container> curl http://localhost:8080/stat
```

### Increase Log Retention
Create a logrotate config to prevent logs from filling up disk:
```bash
docker exec <container> bash -c 'echo "/var/log/nginx/*.log { daily rotate 7 compress }" > /etc/logrotate.d/nginx'
```
