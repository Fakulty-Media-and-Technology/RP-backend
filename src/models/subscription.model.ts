import { HydratedDocumentFromSchema, InferSchemaType, Schema, model } from 'mongoose'

const subscriptionSchema = new Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    plan_id: {
      type: Schema.Types.ObjectId,
      ref: 'Plan',
      required: true,
    },
    start_date: {
      type: Date,
      required: true,
    },
    expiry_date: {
      type: Date,
      required: true,
    },
    payment_method: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
)

export const SubscriptionModel = model('subscriptions', subscriptionSchema)
export type SubscriptionSchema = InferSchemaType<typeof subscriptionSchema>
export type Subscription = HydratedDocumentFromSchema<typeof subscriptionSchema>
