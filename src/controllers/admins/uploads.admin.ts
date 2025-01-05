import { AdminUploadService, AllVideoTypes } from '../../services/core/AdminUploadService'
import { Catch } from '../../utils/Catch'
import { GetDefined } from '../../utils/GetDefined'
import { sendResponse } from '../../utils/responder'

export class AdminUploadController {
  static addEpisode = Catch.async(async (req, res) => {
    await AdminUploadService.addEpisode(req.params.vidId, req.body)

    sendResponse({
      res,
      message: `episode added successfully`,
    })
  })

  static addVideoByType = (type: AllVideoTypes) =>
    Catch.async(async (req, res) => {
      const admin = GetDefined.loggedInUser(req.user)

      await AdminUploadService.addVideo({
        type,
        data: req.body,
        adminId: admin.id,
      })

      sendResponse({
        res,
        message: `${type} added successfully`,
      })
    })

  static editVideoByType = (type: AllVideoTypes) =>
    Catch.async(async (req, res) => {
      const updatedVid = await AdminUploadService.editVideo({
        vidId: req.params.id,
        changes: req.body,
        type,
      })

      sendResponse({
        res,
        data: updatedVid,
        message: `${type} edited successfully`,
      })
    })

  static fetchVideosByType = (type: AllVideoTypes) =>
    Catch.async(async ({ query }, res) => {
      sendResponse({
        res,
        message: `${type}s fetched successfully`,
        data: await AdminUploadService.getVideos(type, query),
      })
    })

  static deleteVideoByType = (type: AllVideoTypes) =>
    Catch.async(async (req, res) => {
      await AdminUploadService.deleteVideo(req.params.id, type)

      sendResponse({
        res,
        message: `${type} deleted successfully`,
      })
    })
}
