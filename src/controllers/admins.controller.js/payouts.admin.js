const PayoutsModel = require('../../models/payouts.model')
const WalletModel = require('../../models/wallet.model')
const {
  serverError,
  successResponse,
  failedResponse,
  invalidRequest,
} = require('../../utils/response.handler')

exports.payoutReqAll = async (req, res) => {
  try {
    const limit = req.query.limit || 10
    const page = req.query.page || 1

    const payouts = await PayoutsModel.aggregate([
      {
        $match: {
          $expr: {},
        },
      },
      {
        $sort: {
          updatedAt: -1,
        },
      },
      {
        $skip: Number(page - 1) * Number(limit) || 0,
      },
      {
        $limit: Number(limit),
      },
    ])

    return successResponse(res, 200, payouts, 'payout requests all')
  } catch (error) {
    return serverError(res, 400, null, error.message)
  }
}

exports.payoutReqOne = async (req, res) => {
  try {
    const id = req.params.id

    const payoutt = await PayoutsModel.aggregate([
      {
        $match: {
          $expr: {
            $eq: [
              '$_id',
              {
                $toObjectId: id,
              },
            ],
          },
        },
      },
      {
        $lookup: {
          from: 'users',
          let: {
            uid: '$client_id',
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: [
                    {
                      $toObjectId: '$_id',
                    },
                    {
                      $toObjectId: '$$uid',
                    },
                  ],
                },
              },
            },
            {
              $project: {
                first_name: 1,
                last_name: 1,
                photo: 1,
                email: 1,
                country_code: 1,
                mobile: 1,
              },
            },
          ],
          as: 'user',
        },
      },
      {
        $set: {
          user: {
            $first: '$user',
          },
        },
      },
    ])

    return successResponse(res, 200, payoutt, 'payout request one')
  } catch (error) {
    return serverError(res, 400, null, error.message)
  }
}

exports.payoutReqGroup = async (req, res) => {
  try {
    const payout = await PayoutsModel.aggregate([
      {
        $match: {
          $expr: {
            // $eq: ["$", ""],
          },
        },
      },
      {
        $group: {
          _id: '$status',
          group: { $push: '$$ROOT' },
        },
      },
    ])

    return successResponse(res, 200, payout, 'payout requests grouped')
  } catch (error) {
    return serverError(res, 400, null, error.message)
  }
}

// exports.payoutStartPayment = async (req, res) => {
//      try {
//           const id = req.params.id;
//           await PayoutsModel.findOneAndUpdate(
//                { _id: id },
//                { status: "processing" },
//                { upsert: true }
//           );

//           return successResponse(res, 200, null, "payout processing started");
//      } catch (error) {
//           return serverError(res, 400, null, error.message);
//      }
// };

exports.payoutStatusUpdate = async (req, res) => {
  try {
    const id = req.params.id
    const admin = req.user
    const { status } = req.body

    if (status === 'completed') {
      //debit from client balance
      const payReq = await PayoutsModel.findOne({
        _id: id,
      })

      await WalletModel.findOneAndUpdate(
        {
          user_id: payReq.client_id,
        },
        {
          $inc: {
            balance: -Number(payReq.amount + payReq.charges),
          },
        },
        { upsert: true },
      )
    }

    await PayoutsModel.findOneAndUpdate(
      { _id: id },
      {
        status: status,
        $push: {
          processed_by: admin._id,
        },
      },
      { upsert: true },
    )

    return successResponse(res, 200, null, 'payout status updated')
  } catch (error) {
    return serverError(res, 400, null, error.message)
  }
}
