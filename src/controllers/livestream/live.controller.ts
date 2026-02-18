import { Catch } from '../../utils/Catch'
import { handleRTMPStreamPublish } from '../../utils/live'
import { OperationalError } from '../../utils/OperationalError'

export class LivestreamCntroller {
  static handleRTMPLivestreamOnPublish = Catch.async(async ({ body }, res) => {
    try {
      await handleRTMPStreamPublish(body.name)
      res.sendStatus(200)
    } catch (e) {
      console.error('onNginxPublishStart Error', e instanceof OperationalError ? e.message : e)
      res.sendStatus(500)
    }
  })
}
