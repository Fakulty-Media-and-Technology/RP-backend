import { MediaService, CreateLiveData } from '../../services/core/MediaService'
import { Catch } from '../../utils/Catch'
import { GetDefined } from '../../utils/GetDefined'
import { OperationalError } from '../../utils/OperationalError'
import { sendResponse } from '../../utils/responder'
import { validate } from '../../middlewares/requestValidator'
import { addLiveSchema } from '../../validations/admin'
import { UploadMediaUtils } from '../../utils/UploadMediaUtils'
import { AuthHeaderKey } from '../../middlewares/auth'

export class SharedController extends UploadMediaUtils {
  static updateProfile = (authType: AuthHeaderKey) => Catch.async(async (req, res) => {
    if (Object.values(req.body).length === 0 && req.file == null) {
      throw new OperationalError('Provide at least one property to update', 400)
    }

    Object.assign(req.body, { userId: req.params.userId })

    await MediaService.updateUserProfile({
      imageFile: req.file,
      data: req.body,
      authType
    })

    sendResponse({
      res,
      message: 'Update successfull',
    })
  })

  static createLive = ({ isAdmin }: { isAdmin: boolean }) =>
    Catch.async(async (req, res) => {
      const { data: _data } = req.body

      if (_data == null || typeof _data !== 'string') {
        throw new OperationalError(
          'formData.data is required and must be a JSON serialized string',
          400,
        )
      }

      const files = this._checkFiles(req.files)
      const parsedData = JSON.parse(_data)

      const data: CreateLiveData = {
        ...parsedData,
        previewVideo: files.previewVideo?.[0],
        channelLogo: files.channelLogo?.[0],
        coverPhoto: files.coverPhoto?.[0],
        clientId: isAdmin ? parsedData.clientId : GetDefined.loggedInUser(req.user).id,
      }

      validate(addLiveSchema, data)

      sendResponse({
        res,
        data: await MediaService.createLive(data),
        message: 'live stream created, credentials are on attached user dashboard',
      })
    })

  static adminGetPhotoUrl = Catch.async(async (req, res) => {
    const { bucket, key } = req.body
    const image = await MediaService.getPhotoUrl(bucket, key)
    sendResponse({ res, data: image, message: 'image fetched' })
  })

  static adminGetSubtitleUrl = Catch.async(async (req, res) => {
    const { bucket, key } = req.body
    const subtitle = await MediaService.getSubtitleUrl(bucket, key)
    sendResponse({ res, data: subtitle, message: 'subtitle fetched' })
  })

  static getVidoeUploadStream = Catch.async(async (req, res) => {
    const _vodStream = await MediaService.getVodStream(
      req.params.vidUploadId,
      GetDefined.loggedInUser(req.user),
    )
    sendResponse({ res, data: _vodStream, message: 'stream fetched' })
  })

  static getSubtitles = Catch.async(async (req, res) => {
    sendResponse({
      res,
      data: await MediaService.getSubtitles(req.params.parentId),
    })
  })
}
