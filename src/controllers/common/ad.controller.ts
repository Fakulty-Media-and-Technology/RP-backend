import { Catch } from '../../utils/Catch'
import { sendResponse } from '../../utils/responder'
import { AdManagerService, CreateAdData } from '../../services/core/AdmanagerService'
import { OperationalError } from '../../utils/OperationalError'
import { UploadMediaUtils } from '../../utils/UploadMediaUtils'
import { validate } from '../../middlewares/requestValidator'
import { createAdSchema } from '../../validations/admin'
import { GetDefined } from '../../utils/GetDefined'

export class AdsController {
  static create = Catch.async(async (req, res) => {
    if (req.body.data == null || typeof req.body.data !== 'string') {
      throw new OperationalError(
        'formData.data is required and must be a JSON serialized string',
        400,
      )
    }

    const files = UploadMediaUtils._checkFiles(req.files)

    if (Object.keys(files).length === 0) {
      throw new OperationalError('Expected at least one file', 400)
    }

    const data: CreateAdData = {
      ...JSON.parse(req.body.data),
      videoFile: files.video?.[0],
      imageFile: files.image?.[0],
    }

    validate(createAdSchema, data)

    const ad = await AdManagerService.create(data)

    sendResponse({
      res,
      statusCode: 201,
      message: `${ad.title} added`,
      data: ad,
    })
  })

  static fetchMany = Catch.async(async ({ query, user }, res) => {
    const ads = await AdManagerService.getMany(GetDefined.loggedInUser(user)._id.toString(), query)

    sendResponse({
      res,
      data: ads,
      message: 'ads fetched',
    })
  })

  static fetchRandom = Catch.async(async ({ query }, res) => {
    const ads = await AdManagerService.getRandom(query.type)

    sendResponse({
      res,
      data: ads,
      message: 'ad fetched',
    })
  })

  static removeById = Catch.async(async (req, res) => {
    await AdManagerService.deleteAd(req.params.id)

    sendResponse({
      res,
      message: 'ad deleted',
    })
  })
}
