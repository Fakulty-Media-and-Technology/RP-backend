import { AdminUploadService, AllVideoTypes } from '../../services/core/AdminUploadService'
import { Catch } from '../../utils/Catch'
import { GetDefined } from '../../utils/GetDefined'
import { sendResponse } from '../../utils/responder'

export class AdminUploadController {
  static addSeason = Catch.async(async (req, res) => {
    sendResponse({
      res,
      message: `season added successfully`,
      data: await AdminUploadService.addSeason(
        req.params.videoId,
        GetDefined.loggedInUser(req.user).id,
      ),
    })
  })

  static addEpisode = Catch.async(async (req, res) => {
    await AdminUploadService.addEpisode({
      seasonId: req.params.seasonId,
      adminId: GetDefined.loggedInUser(req.user).id,
      data: req.body,
    })

    sendResponse({
      res,
      message: `episode added successfully`,
    })
  })

  static addVideoByType = (type: AllVideoTypes) =>
    Catch.async(async (req, res) => {
      const admin = GetDefined.loggedInUser(req.user)

      const video = await AdminUploadService.addVideo({
        type,
        data: req.body,
        adminId: admin.id,
      })

      sendResponse({
        res,
        message: `${type} added successfully`,
        data: video,
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
