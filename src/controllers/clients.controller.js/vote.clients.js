const ContestantsModel = require('../../models/contestants.model')
const VoteInfoModel = require('../../models/voteInfo.model')
const { readPhotos } = require('../../services/media-access')
const { invalidRequest, successResponse, serverError } = require('../../utils/response.handler')

exports.createVoteInfo = async (req, res) => {
  try {
    const { live_id, price, status } = req.body

    const user = req.user
    if (user.role !== 'tvshow') {
      return invalidRequest(res, 400, null, 'this feature is not available to you')
    }

    if (!live_id || !price || !status) {
      return invalidRequest(res, 400, null, 'all inputs are required')
    }

    const voteExits = await VoteInfoModel.findOne({
      live_id: live_id,
    })

    if (voteExits) {
      return invalidRequest(
        res,
        400,
        null,
        'vote poll has already been created for this live event',
      )
    }

    if (!live_id || !price || !status) {
      return invalidRequest(res, 400, null, 'all inputs are required')
    }

    await new VoteInfoModel({
      live_id: live_id,
      client_id: user._id,
      price: Number(price),
      status: status,
    }).save()

    return successResponse(res, 200, null, 'vote-info instace created')
  } catch (error) {
    return serverError(res, 500, null, error.message)
  }
}

exports.updateVoteInfo = async (req, res) => {
  try {
    const { live_id, price, status } = req.body

    const user = req.user

    const voteEx = await VoteInfoModel.findOne({
      live_id: live_id,
      client_id: user._id,
    })

    if (!voteEx) {
      return invalidRequest(res, 400, null, 'cannot find your live voting instance')
    }

    await VoteInfoModel.findOneAndUpdate(
      {
        live_id: live_id,
        client_id: user._id,
      },
      {
        price: price ? Number(price) : voteEx.price,
        status: status ? status : voteEx.status,
      },
      {
        upsert: true,
      },
    )

    return successResponse(res, 200, null, 'vote-info updated')
  } catch (error) {
    return serverError(res, 500, null, error.message)
  }
}

exports.addVoteContestant = async (req, res) => {
  try {
    const { live_id, names, photo, occupation, bio, contact } = req.body

    const user = req.user
    if (user.role !== 'tvshow') {
      return invalidRequest(res, 400, null, 'this feature is not available to you')
    }

    if (!live_id || !names || !occupation || !bio || !contact) {
      return invalidRequest(res, 400, null, 'all inputs are required')
    }

    await new ContestantsModel({
      live_id: live_id,
      names: names,
      photo: photo,
      occupation: occupation,
      bio: bio,
      contact: contact,
    }).save()

    return successResponse(res, 200, null, 'vote contestant added')
  } catch (error) {
    return serverError(res, 500, null, error.message)
  }
}

exports.fetchVoteContestants = async (req, res) => {
  try {
    const { live_id } = req.query

    const user = req.user
    if (user.role !== 'tvshow') {
      return invalidRequest(res, 400, null, 'this feature is not available to you')
    }

    const contests = await ContestantsModel.aggregate([
      {
        $match: {
          $expr: {
            $eq: [
              '$live_id',
              {
                $toObjectId: live_id,
              },
            ],
          },
        },
      },
    ])

    return successResponse(res, 200, contests, 'vote contestants')
  } catch (error) {
    return serverError(res, 500, null, error.message)
  }
}

exports.rmVoteContestants = async (req, res) => {
  try {
    const { contestant_id, live_id } = req.query

    const user = req.user
    if (user.role !== 'tvshow') {
      return invalidRequest(res, 400, null, 'this feature is not available to you')
    }

    await ContestantsModel.findOneAndDelete({
      live_id,
      _id: contestant_id,
    })

    return successResponse(res, 200, contests, 'vote contestants')
  } catch (error) {
    return serverError(res, 500, null, error.message)
  }
}

exports.votestatusInfo = async (req, res) => {
  try {
    const { live_id } = req.query

    const user = req.user
    if (user.role !== 'tvshow') {
      return invalidRequest(res, 400, null, 'this feature is not available to you')
    }

    const voteInfo = await VoteInfoModel.aggregate([
      {
        $match: {
          $expr: {
            $eq: [
              '$live_id',
              {
                $toObjectId: live_id,
              },
            ],
          },
        },
      },
      {
        $project: {
          __v: 0,
        },
      },
    ])

    const contestantInfo = await ContestantsModel.aggregate([
      {
        $match: {
          $expr: {
            $eq: [
              '$live_id',
              {
                $toObjectId: live_id,
              },
            ],
          },
        },
      },
      {
        $sort: {
          votes: -1,
        },
      },
    ])

    for (let event of contestantInfo) {
      if (event.photo && event.photo.Bucket && event.photo.Key) {
        const signedUrl = await readPhotos(event.photo.Bucket, event.photo.Key)
        event.photo_url = signedUrl.status == 400 ? 'no picture' : signedUrl
      } else {
        event.photo_url = 'no picture'
      }
    }

    return successResponse(
      res,
      200,
      {
        vote_info: voteInfo,
        contestant_ranking: contestantInfo,
      },
      'voting progress info',
    )
  } catch (error) {
    return serverError(res, 500, null, error.message)
  }
}
