import { TrailerModel } from '../../models/trailer.model'
import { Catch } from '../../utils/catchAsync'
import { sendResponse } from '../../utils/responder'

export class AdminTrailerController {
  static createTrailer = Catch.async(async (req, res) => {
    const { bucket, key, video_id, video_title, details } = req.body

    const addTrailer = new TrailerModel({
      video_id: video_id,
      video_title: video_title,
      details: details,
      bucket: bucket,
      key: key,
    })

    await addTrailer.save()

    sendResponse({
      res,
      message: 'trailer ended',
    })
  })
}
