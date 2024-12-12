const GiftcardModel = require('../../models/giftcard.model')
const uniqueRef = require('../../services/unique-ref')
const { serverError, successResponse, failedResponse } = require('../../utils/responder.ts')

exports.createGiftCard = async (req, res) => {
  try {
    const uniq_code = await uniqueRef()

    const user = req.user
    const { amount } = req.body

    const checkExist = await GiftcardModel.findOne({
      code: uniq_code,
    })

    if (checkExist) {
      return failedResponse(res, 400, null, 'something went wrong, please try again')
    }

    const getSerial = await GiftcardModel.aggregate([
      {
        $match: {
          $expr: {
            $ne: ['$_id', null],
          },
        },
      },
      {
        $sort: {
          createdAt: -1,
          serial_number: -1,
        },
      },
    ])

    const serialN = Number(getSerial[0].serial_number)

    const newGift = new GiftcardModel({
      admin_id: user._id,
      serial_number: serialN + 1,
      code: uniq_code,
      amount: amount,
    })

    const card = await newGift.save()

    return successResponse(res, 200, card, 'gift card created')
  } catch (error) {
    return serverError(res, 500, null, error.message)
  }
}

exports.fetchGiftCards = async (req, res) => {
  try {
    const limit = req.query.limit || 10
    const page = req.query.page || 1

    const getCards = await GiftcardModel.aggregate([
      {
        $match: {
          $expr: {
            $ne: ['$_id', null],
          },
        },
      },
      {
        $sort: {
          createdAt: -1,
          serial_number: -1,
        },
      },
      {
        $addFields: {
          serial_number: {
            $concat: [
              'SN',
              {
                $toString: '$serial_number',
              },
            ],
          },
        },
      },
      {
        $skip: Number(page - 1) * Number(limit) || 0,
      },
      {
        $limit: Number(limit),
      },
    ])

    return successResponse(res, 200, getCards, 'all giftcards fetched')
  } catch (error) {
    return serverError(res, 500, null, error.message)
  }
}
