#!/bin/bash

echo "🎬 RTMP & HLS Stream Monitoring Dashboard"
echo "================================================"
echo "Monitoring active streams, errors, and issues..."
echo ""

# Check if logs exist, if not create them
mkdir -p /var/log/nginx

# Function to show log summary
show_summary() {
    echo ""
    echo "📊 STREAM SUMMARY (Last 10 events):"
    echo "---"
    tail -10 /var/log/nginx/rtmp-stream.log 2>/dev/null || echo "(No RTMP events yet)"
    echo ""
    echo "📊 HLS ACTIVITY (Last 10 requests):"
    echo "---"
    tail -10 /var/log/nginx/hls-access.log 2>/dev/null || echo "(No HLS activity yet)"
    echo ""
    echo "⚠️  ERRORS (Last 10):"
    echo "---"
    tail -10 /var/log/nginx/hls-error.log 2>/dev/null || echo "(No errors)"
}

# Monitor both logs in real-time
echo "Starting real-time monitoring (Press Ctrl+C to stop)..."
echo ""

# Initially show summary, then follow logs
(show_summary; tail -f /var/log/nginx/rtmp-stream.log /var/log/nginx/hls-access.log /var/log/nginx/hls-error.log 2>/dev/null) | while IFS= read -r line; do
    if [[ $line == *"RTMP"* ]] || [[ $line == *"HLS"* ]] || [[ $line == *"ERROR"* ]] || [[ $line == *"error"* ]]; then
        echo "$line"
    fi
done

echo ""
echo "Make sure you're running this inside the Docker container or with appropriate log paths."

