import { HydratedDocumentFromSchema, InferSchemaType, Schema, model } from 'mongoose'

const planSchema = new Schema(
  {
    admin_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    months_duration: {
      type: Number,
      unique: true,
      enum: [1, 3, 6, 12],
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    details: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
    methods: {
      getFutureDate(days: number = 30) {
        const daysInMilliseconds = days * 24 * 60 * 60 * 1000
        const now = new Date()

        const futureDate = new Date(
          now.getTime() + Number(this.months_duration) * daysInMilliseconds,
        )

        return futureDate
      },
    },
  },
)

export const PlanModel = model('Plan', planSchema)
export type PlanSchema = InferSchemaType<typeof planSchema>
export type Plan = HydratedDocumentFromSchema<typeof planSchema>
