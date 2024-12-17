import { TrailerModel } from '../../models/trailer.model'
import { UpcomingModel } from '../../models/upcoming.model'
import { Catch } from '../../utils/catchAsync'
import { OperationalError } from '../../utils/OperationalError'
import { handleDefaultNumAndUnknown } from '../../utils/QueryParamsFeatures'
import { sendResponse } from '../../utils/responder'

export class AdminUpcomingController {
  static createUpcomingEvent = Catch.async(async (req, res) => {
    const { title, type, details, release_date, portrait_photo, landscape_photo, trailer_id } =
      req.body

    if (!title || !type || !details || !release_date || !portrait_photo || !landscape_photo) {
      throw new OperationalError('all details are required', 400)
    }

    const checkTrailer = await TrailerModel.findOne({ _id: trailer_id })

    if (!checkTrailer) {
      throw new OperationalError('invalid trailer_id supplied', 400)
    }

    const upcomingEvent = new UpcomingModel({
      title: title,
      type: type,
      details: details,
      release_date: new Date(release_date),
      portrait_photo: portrait_photo,
      landscape_photo: landscape_photo,
      trailer_id: trailer_id,
    })

    await upcomingEvent.save()

    sendResponse({
      res,
      data: upcomingEvent,
      message: 'invalid trailer_id supplied',
    })
  })

  static upcomingsAllGet = Catch.async(async ({ query }, res) => {
    const limit = handleDefaultNumAndUnknown(query.limit, 10)
    const page = handleDefaultNumAndUnknown(query.page, 1)

    const allDat = await UpcomingModel.aggregate([
      {
        $match: {},
      },
      {
        $project: {
          __v: 0,
          createdAt: 0,
          updatedAt: 0,
        },
      },
      {
        $skip: (page - 1) * limit || 0,
      },
      {
        $limit: limit,
      },
    ])

    sendResponse({
      res,
      data: allDat,
      message: 'all upcomings fetched',
    })
  })
}
