import { HydratedDocumentFromSchema, InferSchemaType, Schema, model } from 'mongoose'

const schema = new Schema(
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
      enum: [1, 3, 6, 12],
      unique: true,
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

export const PlanModel = model('plans', schema)
export type PlanSchema = InferSchemaType<typeof schema>
export type Plan = HydratedDocumentFromSchema<typeof schema>
