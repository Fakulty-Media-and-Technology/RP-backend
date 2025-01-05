import { LiveModel } from '../models/lives.model'
import { PaymentDetailModel } from '../models/paymentDetails.model'
import { PaymentModel } from '../models/payments.model'
import { PlanModel } from '../models/plans.model'
import { SubscriptionModel } from '../models/subscription.model'
import { setTranscodes, Video, VideoModel } from '../models/videos.model'
import { WalletModel } from '../models/wallet.model'
import PaymentServices, { convertKoboToNaira } from '../paymentIntegration'
import { UserRepo } from '../repositories/UserRepo'
import { VideoRepo } from '../repositories/VideoRepo'
import { MediaConvert } from '../services/aws/mediaConvert'
import Email from '../utils/emailer'

type TranscodedKeyPairs = Awaited<
  ReturnType<typeof MediaConvert.recentCompletedJobsKeyPairs>
>[number]

const stringify = (data: Object) => JSON.stringify(data, null, 2)

export class CronTaskHandlers {
  private static _replaceInputKey = async ({ inputKey, outputKey }: TranscodedKeyPairs) => {
    let updatedVid: Video | null = null

    updatedVid = await VideoRepo.replaceKey(inputKey, outputKey)

    // series
    if (updatedVid === null) {
      updatedVid = await VideoRepo.replaceSeriesKey(inputKey, outputKey)
    }

    return updatedVid
  }

  static updateVideoS3Keys = async () => {
    const pairs = await MediaConvert.recentCompletedJobsKeyPairs()
    const funcLoc = 'CronTaskHandlers.updateVideoS3Keys'

    pairs.forEach(async pair => {
      try {
        // set the key from input bucket key to transcode bucket key
        const vid = await this._replaceInputKey(pair)

        if (vid) {
          // use the transcode key to set transcodes array in root or episodes
          await setTranscodes(vid, true)
          const typeDesc = vid.is_series ? 'series' : ''
          console.log(`Updated video ${typeDesc} with ID: ${vid.id} in ${funcLoc}`)
        }
      } catch (e) {
        console.error(`🛑Error updating video with inputKey: ${pair.inputKey} in ${funcLoc}`)
        console.error('Error details', e)
      }
    })
  }

  static autoRenewSubscriptions = async () => {
    try {
      const now = new Date()

      const updatedExpiredSubsResult = await SubscriptionModel.updateMany(
        {
          active: true,
          expiry_date: { $lte: now },
        },
        {
          $set: { active: false },
        },
      )

      if (updatedExpiredSubsResult.modifiedCount === 0) {
        console.log('AUTO-RENEW: No Expired Sub')
        return 'no expired sub'
      }

      const expiredSubs = await SubscriptionModel.find({
        active: false,
        expiry_date: { $lte: now },
        updatedAt: { $gte: now }, // this gives the most recently updated subs
      })

      if (expiredSubs.length !== updatedExpiredSubsResult.modifiedCount) {
        console.error('AUTO-RENEW: Logical Dev Error in autoRenewSubscription')
        return
      }

      expiredSubs.forEach(async sub => {
        try {
          const customerDetl = await UserRepo.getUserById(sub.user_id)

          if (customerDetl === null) {
            throw new Error(
              `${sub.user_id} could not be found in autoRenewSubscription cronjob for sub: ${stringify(sub)}`,
            )
          }

          const subPlan = await PlanModel.findById(sub.plan_id)

          if (subPlan === null) {
            throw new Error(
              `${sub.plan_id} could not be found in autoRenewSubscription cronjob for sub: ${stringify(sub)}`,
            )
          }

          const cardDetails = await PaymentDetailModel.findOne({
            user_id: customerDetl._id,
          })

          if (cardDetails === null) {
            throw new Error(
              `card details could not be found in autoRenewSubscription cronjob for customer: ${stringify(customerDetl)}`,
            )
          }

          if (cardDetails.authorization_code == null) {
            throw new Error(
              `card detials does not have authorization_code in autoRenewSubscription cronjob for. Crad details ${stringify(cardDetails)}`,
            )
          }

          if (cardDetails) {
            const response = await PaymentServices.paystackAuthorizePayment({
              authorization_code: cardDetails.authorization_code,
              email: customerDetl.email,
              amount: subPlan.price,
              user_id: customerDetl.id,
              full_name: `${customerDetl.first_name} ${customerDetl.last_name}`,
            })

            const { status, amount, metadata, customer, reference } = response.data

            const nairaAmount = convertKoboToNaira(amount)

            if (status !== 'success') {
              const newPayment = new PaymentModel({
                user_id: metadata.user_id,
                full_name: metadata.full_name,
                email: customer.email,
                amount: nairaAmount,
                reference,
                status,
              })

              await newPayment.save()

              //TODO: send email and push notification here
              const mailData = {
                firstName: customerDetl.first_name,
                lastName: customerDetl.last_name,
                email: customerDetl.email,
              }

              await new Email(mailData).sendAutoRenewFailure(
                'unsuccessful attempt to charge your saved card details',
              )

              console.error(
                'auto-renew subscription request unsuccessfull. Payment details:',
                stringify(newPayment),
              )
              return
            }

            const newPayment = new PaymentModel({
              user_id: metadata.user_id,
              full_name: metadata.full_name,
              email: customer.email,
              amount: nairaAmount,
              reference: reference,
              status: status,
            })

            const nPayment = await newPayment.save()

            await new SubscriptionModel({
              user_id: customerDetl._id,
              plan_id: subPlan._id,
              start_date: new Date(),
              expiry_date: subPlan.getFutureDate(30),
              payment_method: 'auto-renew',
              amount: Number(subPlan.price),
            }).save()

            await PaymentModel.findOneAndUpdate(
              {
                _id: nPayment._id,
                reference: nPayment.reference,
              },
              {
                is_used: true,
                use_case: 'subscription',
              },
              {
                upsert: true,
              },
            )

            //TODO: send successful email and push notification here with reciept
            const mailData = {
              firstName: customerDetl.first_name,
              lastName: customerDetl.last_name,
              email: customerDetl.email,
            }

            await new Email(mailData).sendAutoRenewSuccess('saved debit card details')

            console.log(
              'auto-renew subscription with card success. Payment details:',
              stringify(nPayment),
            )
            return
          }

          // user does not have card details here
          const cusWallet = await WalletModel.findOne({
            user_id: sub.user_id,
          })

          if (cusWallet == null) {
            throw new Error(
              `auto-renew: Customer does not have a wallet: ${stringify(customerDetl)}`,
            )
          }

          if (cusWallet.balance < subPlan.price) {
            //TODO: send email and push
            const mailData = {
              firstName: customerDetl.first_name,
              lastName: customerDetl.last_name,
              email: customerDetl.email,
            }

            await new Email(mailData).sendAutoRenewFailure('insufficient wallet balance')

            console.error(
              `auto-renew: customer has insufficent balance in wallet: ${stringify(cusWallet)}: sub-plan: ${stringify(subPlan)}`,
            )

            return
          }

          await new SubscriptionModel({
            user_id: customerDetl._id,
            plan_id: subPlan._id,
            start_date: new Date(),
            expiry_date: subPlan.getFutureDate(30),
            payment_method: 'auto-renew',
            amount: Number(subPlan.price),
          }).save()

          await WalletModel.findOneAndUpdate(
            {
              _id: cusWallet._id,
              user_id: customerDetl._id,
            },
            {
              $inc: {
                balance: -Number(subPlan.price),
              },
            },
            {
              upsert: true,
            },
          )

          //TODO: send email and push
          const mailData = {
            firstName: customerDetl.first_name,
            lastName: customerDetl.last_name,
            email: customerDetl.email,
          }

          await new Email(mailData).sendAutoRenewSuccess('wallet balance')

          console.log('sub renewed for customer', stringify(customerDetl))
        } catch (e: any) {
          console.error('Error auto renewing subscription for', stringify(sub))
          console.error('Error details:', e.message ?? e)
        }
      })
    } catch (error) {
      console.log('Cron Error: auto-renew', error)
    }
  }

  static activateLiveStream = async () => {
    try {
      const dateN = Date.now() + 60000 * 30

      const openClientConnect = await LiveModel.updateMany(
        {
          start: { $lte: new Date(dateN) },
          active: false,
          expired: false,
        },
        {
          $set: { active: true },
        },
      )

      if (openClientConnect.modifiedCount === 0) {
        console.log('No Livestream Time Elapse')
        return
      }

      console.log('Next Livestream Permission Activated')
    } catch (error: any) {
      console.log('Cron Error: activate livestream', error.message ?? error)
    }
  }

  static deActivateLiveStream = async () => {
    try {
      const dateN = Date.now()

      const openClientConnect = await LiveModel.updateMany(
        {
          $and: [{ expiry: { $exists: true } }, { expiry: { $lte: new Date(dateN) } }],
          active: true,
          expired: false,
        },
        {
          $set: {
            active: false,
            expired: true,
          },
        },
      )

      if (openClientConnect.modifiedCount === 0) {
        console.log('No Expired Livestream')
        return
      }

      console.log('Expired Live Event Deactivated')
    } catch (error: any) {
      console.log('Cron Error: deactivate livestream', error.message ?? error)
    }
  }

  static expireFeaturedContents = async () => {
    try {
      const dateNow = new Date()

      const expiredFeatured = await LiveModel.updateMany(
        {
          feat_expiry: { $lte: dateNow },
          $and: [{ featured: { $exists: true } }, { featured: true }],
        },
        {
          $set: { featured: false },
        },
      )

      if (expiredFeatured.matchedCount === 0) {
        console.log('No Expired Featured Content')
        return
      }

      const expiredFeaturedVod = await VideoModel.updateMany(
        {
          feat_expiry: { $lte: dateNow },
          $and: [{ featured: { $exists: true } }, { featured: true }],
        },
        { $set: { featured: false } },
      )

      if (expiredFeaturedVod.matchedCount === 0) {
        console.log('No Expired Featured Content')
        return
      }

      console.log('Expired Featured Contents Expired')
    } catch (error: any) {
      console.log('Cron Error: expire featured content', error.message ?? error)
    }
  }
}
