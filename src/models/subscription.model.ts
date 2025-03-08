import { HydratedDocumentFromSchema, InferSchemaType, Schema, model } from 'mongoose'

const schema = new Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'users',
      required: true,
    },
    plan_id: {
      type: Schema.Types.ObjectId,
      ref: 'plans',
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

export const SubscriptionModel = model('subscriptions', schema)
export type SubscriptionSchema = InferSchemaType<typeof schema>
export type Subscription = HydratedDocumentFromSchema<typeof schema>
