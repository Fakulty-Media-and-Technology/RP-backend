import { Catch } from '../../utils/Catch'
import { LiveModel } from '../../models/lives.model'

/**
 * Controller for nginx-rtmp module callbacks.
 * These endpoints are called by nginx-rtmp on stream events.
 * 
 * nginx-rtmp sends POST requests with form data containing:
 * - app: RTMP application name (e.g., "live")
 * - name: Stream key/name
 * - addr: Client IP address
 * - clientid: Unique client identifier
 * - call: Type of callback (publish, play, etc.)
 * 
 * Return HTTP 2xx to allow, 3xx/4xx/5xx to deny.
 */
export class RTMPWebhooksController {
  /**
   * Called when a stream stops publishing.
   * Use this to update live event status or clean up resources.
   */
  static onPublishDone = Catch.async(async (req, res) => {
    const { name: streamKey, app, addr } = req.body

    console.log(`[RTMP] Stream ended - app: ${app}, key: ${streamKey}, addr: ${addr}`)

    try {
      // Update the live event status to indicate stream has ended
      await LiveModel.findOneAndUpdate(
        { stream_key: streamKey },
        { $set: { isLive: false, lastStreamEndedAt: new Date() } }
      )

      res.sendStatus(200)
    } catch (error) {
      console.error('[RTMP] onPublishDone error:', error)
      res.sendStatus(200) // Still return 200 to not block nginx
    }
  })

  /**
   * Called when a client starts playing/watching a stream.
   * Use this to validate viewer access or track viewership.
   */
  static onPlay = Catch.async(async (req, res) => {
    const { name: streamKey, app, addr } = req.body

    console.log(`[RTMP] Viewer connected - app: ${app}, key: ${streamKey}, addr: ${addr}`)

    try {
      // Validate that the stream exists and is still valid
      const liveEvent = await LiveModel.findOne({ stream_key: streamKey })
        .select('expiry')
        .lean()

      if (!liveEvent) {
        console.warn(`[RTMP] Play rejected - invalid stream key: ${streamKey}`)
        return res.sendStatus(404)
      }

      const now = new Date()
      if (liveEvent.expiry < now) {
        console.warn(`[RTMP] Play rejected - expired stream: ${streamKey}`)
        return res.sendStatus(403)
      }

      res.sendStatus(200)
    } catch (error) {
      console.error('[RTMP] onPlay error:', error)
      res.sendStatus(200) // Allow play on error to not disrupt viewing
    }
  })
}
