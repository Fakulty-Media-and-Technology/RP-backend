import { HydratedDocumentFromSchema, InferSchemaType, Schema, model } from 'mongoose'

const suggestionSchema = new Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    seen: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
)

export const SuggestionModel = model('Suggestion', suggestionSchema)
export type SuggestionSchema = InferSchemaType<typeof suggestionSchema>
export type Suggestion = HydratedDocumentFromSchema<typeof suggestionSchema>
