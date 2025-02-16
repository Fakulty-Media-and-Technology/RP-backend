import { MedaiService, CreateLiveData } from '../../services/core/MediaService'
import { Catch } from '../../utils/Catch'
import { GetDefined } from '../../utils/GetDefined'
import { OperationalError } from '../../utils/OperationalError'
import { sendResponse } from '../../utils/responder'
import { checkFiles } from '../admins/uploads.admin'
import { validate } from '../../middlewares/requestValidator'
import { addLiveSchema } from '../../validations/admin'

export class MediaController {
  static createLive = ({ isAdmin }: { isAdmin: boolean }) =>
    Catch.async(async (req, res) => {
      const { data: _data } = req.body

      if (_data == null || typeof _data !== 'string') {
        throw new OperationalError(
          'formData.data is required and must be a JSON serialized string',
          400,
        )
      }

      const files = checkFiles(req.files)
      const parsedData = JSON.parse(_data)
      const data: CreateLiveData = {
        ...parsedData,
        previewVideo: files.previewVideo?.[0],
        coverPhoto: files.coverPhoto?.[0],
        clientId: isAdmin ? parsedData.clientId : GetDefined.loggedInUser(req.user).id,
      }

      validate(addLiveSchema, data)

      sendResponse({
        res,
        data: await MedaiService.createLive(data),
        message: 'live stream created, credentials are on attached user dashboard',
      })
    })

  static adminGetPhotoUrl = Catch.async(async (req, res) => {
    const { bucket, key } = req.body
    const image = await MedaiService.getPhotoUrl(bucket, key)
    sendResponse({ res, data: image, message: 'image fetched' })
  })

  static adminGetSubtitleUrl = Catch.async(async (req, res) => {
    const { bucket, key } = req.body
    const subtitle = await MedaiService.getSubtitleUrl(bucket, key)
    sendResponse({ res, data: subtitle, message: 'subtitle fetched' })
  })

  static getVidoeUploadStream = Catch.async(async (req, res) => {
    const _vodStream = await MedaiService.getVodStream(
      req.params.vidUploadId,
      GetDefined.loggedInUser(req.user),
    )
    sendResponse({ res, data: _vodStream, message: 'stream fetched' })
  })

  static getSubtitles = Catch.async(async (req, res) => {
    sendResponse({
      res,
      data: await MedaiService.getSubtitles(req.params.parentId),
    })
  })
}
