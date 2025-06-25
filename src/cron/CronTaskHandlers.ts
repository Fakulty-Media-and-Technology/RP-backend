import { LiveModel } from '../models/lives.model'
import { PaymentDetailModel } from '../models/paymentDetails.model'
import { PaymentModel } from '../models/payments.model'
import { PlanModel } from '../models/plans.model'
import { SubscriptionModel } from '../models/subscription.model'
import { VideoUploadModel } from '../models/videoupload.model'
import { VideoModel } from '../models/videos.model'
import { WalletModel } from '../models/wallet.model'
import PaymentServices, { convertKoboToNaira } from '../paymentIntegration'
import { UserRepo } from '../repositories/UserRepo'
import { MediaConvert } from '../services/aws/mediaConvert'
import { S3 } from '../services/aws/s3'
import Email from '../utils/emailer'
import moment from 'moment'

const stringify = (data: Object) => JSON.stringify(data, null, 2)
const laterInMins = (mins: number) => moment().add(mins, 'minutes').toDate()

export class CronTaskHandlers {
  static updateVidUploadsResolutions = async () => {
    const pairs = await MediaConvert.recentCompletedJobsKeyPairs()
    const funcLoc = 'CronTaskHandlers.updateVidUploadsResolutions'

    //
    pairs.forEach(async pair => {
      try {
        const vid = await VideoUploadModel.findOneAndUpdate(
          {
            key: pair.inputKey,
            isTranscoded: false,
          },
          {
            $set: {
              isTranscoded: true,
              resolutions: await S3.setResolutionsPairs(pair.inputKey),
            },
          },
        )

        vid && console.log(`✔Video upload with ID: ${vid.id} updated in ${funcLoc}`)
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

          // TODO://
          // if (cardDetails) {
          //   const response = await PaymentServices.paystackAuthorizePayment({
          //     authorization_code: cardDetails.authorization_code,
          //     email: customerDetl.email,
          //     amount: subPlan.price,
          //     user_id: customerDetl.id,
          //     full_name: `${customerDetl.first_name} ${customerDetl.last_name}`,
          //   })

          //   const { status, amount, metadata, customer, reference } = response.data

          //   const nairaAmount = convertKoboToNaira(amount)

          //   if (status !== 'success') {
          //     const newPayment = new PaymentModel({
          //       user_id: metadata.user_id,
          //       full_name: metadata.full_name,
          //       email: customer.email,
          //       amount: nairaAmount,
          //       reference,
          //       status,
          //     })

          //     await newPayment.save()

          //     //TODO: send email and push notification here
          //     const mailData = {
          //       firstName: customerDetl.first_name,
          //       lastName: customerDetl.last_name,
          //       email: customerDetl.email,
          //     }

          //     await new Email(mailData).sendAutoRenewFailure(
          //       'unsuccessful attempt to charge your saved card details',
          //     )

          //     console.error(
          //       'auto-renew subscription request unsuccessfull. Payment details:',
          //       stringify(newPayment),
          //     )
          //     return
          //   }

          //   const newPayment = new PaymentModel({
          //     user_id: metadata.user_id,
          //     full_name: metadata.full_name,
          //     email: customer.email,
          //     amount: nairaAmount,
          //     reference: reference,
          //     status: status,
          //   })

          //   const nPayment = await newPayment.save()

          //   await new SubscriptionModel({
          //     user_id: customerDetl._id,
          //     plan_id: subPlan._id,
          //     start_date: new Date(),
          //     expiry_date: subPlan.getFutureDate(30),
          //     payment_method: 'auto-renew',
          //     amount: Number(subPlan.price),
          //   }).save()

          //   await PaymentModel.findOneAndUpdate(
          //     {
          //       _id: nPayment._id,
          //       reference: nPayment.reference,
          //     },
          //     {
          //       is_used: true,
          //       use_case: 'subscription',
          //     },
          //     {
          //       upsert: true,
          //     },
          //   )

          //   //TODO: send successful email and push notification here with reciept
          //   const mailData = {
          //     firstName: customerDetl.first_name,
          //     lastName: customerDetl.last_name,
          //     email: customerDetl.email,
          //   }

          //   await new Email(mailData).sendAutoRenewSuccess('saved debit card details')

          //   console.log(
          //     'auto-renew subscription with card success. Payment details:',
          //     stringify(nPayment),
          //   )
          //   return
          // }

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

  // static activateLiveStream = async () => {
  //   try {
  //     const { modifiedCount } = await LiveModel.updateMany(
  //       {
  //         start: { $gte: laterInMins(30) },
  //         active: false,
  //         expired: false,
  //       },
  //       {
  //         $set: { active: true },
  //       },
  //     )

  //     if (modifiedCount === 0) {
  //       console.log('No Livestream Time Elapse')
  //       return
  //     }

  //     console.log(modifiedCount, 'live documents made active')
  //   } catch (error: any) {
  //     console.log('Cron Error: activate livestream', error.message ?? error)
  //   }
  // }

  // static deActivateLiveStream = async () => {
  //   try {
  //     const { modifiedCount } = await LiveModel.updateMany(
  //       {
  //         expiry: { $lte: new Date() },
  //         active: true,
  //         expired: false,
  //       },
  //       {
  //         $set: {
  //           active: false,
  //           expired: true,
  //         },
  //       },
  //     )

  //     if (modifiedCount === 0) {
  //       console.log('No Expired Livestream')
  //       return
  //     }

  //     console.log(modifiedCount, 'live documents Expired')
  //   } catch (error: any) {
  //     console.log('Cron Error: deactivate livestream', error.message ?? error)
  //   }
  // }

  static expireFeaturedContents = async () => {
    try {
      const dateNow = new Date()

      const filter = {
        featured: true,
        $and: [
          {
            feat_expiry: { $exists: true },
          },
          {
            feat_expiry: { $gte: dateNow },
          },
        ],
      }

      const expiredFeatured = await LiveModel.updateMany(filter, {
        $set: { featured: false },
      })

      if (expiredFeatured.matchedCount === 0) {
        console.log('No Expired Featured Content')
        return
      }

      const expiredFeaturedVod = await VideoModel.updateMany(filter, { $set: { featured: false } })

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
