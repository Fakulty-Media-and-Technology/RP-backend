const AdmanagerModel = require('../../models/admanager.model')
const { successResponse, serverError } = require('../../utils/response.handler')

exports.addAds = async (req, res) => {
  try {
    const { title, sub_title, type, brand, photo, link, duration, start, expiry, active } = req.body

    await new AdmanagerModel({
      title,
      sub_title,
      type,
      brand,
      photo,
      link,
      duration,
      start,
      expiry,
      active,
    }).save()

    return successResponse(res, 200, null, 'new ads added')
  } catch (error) {
    return serverError(res, 500, null, error.message)
  }
}

exports.getAds = async (req, res) => {
  try {
    const limit = req.query.limit || 10
    const page = req.query.page || 1

    const ads = await AdmanagerModel.aggregate([
      {
        $match: {},
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
      {
        $skip: Number(page - 1) * Number(limit) || 0,
      },
      {
        $limit: Number(limit),
      },
    ])

    return successResponse(res, 200, ads, 'ads fetched')
  } catch (error) {
    return serverError(res, 500, null, error.message)
  }
}

exports.remAds = async (req, res) => {
  try {
    const id = req.params.id

    await AdmanagerModel.findOneAndDelete({
      _id: id,
    })

    return successResponse(res, 200, null, 'ad deleted')
  } catch (error) {
    return serverError(res, 500, null, error.message)
  }
}
