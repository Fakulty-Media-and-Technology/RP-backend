import { HydratedDocumentFromSchema, InferSchemaType, Schema, model } from 'mongoose'

const usersSchema = new Schema(
  {
    first_name: {
      type: String,
      lowercase: true,
      trim: true,
      required: true,
    },
    last_name: {
      type: String,
      lowercase: true,
      trim: true,
      required: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      required: [true, 'Email is required'],
      unique: true,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address'],
    },
    country_code: {
      type: String,
      trim: true,
      required: true,
    },
    mobile: {
      type: String,
      trim: true,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },

    pin: {
      type: String,
      // required: true,
    },

    role: {
      type: String,
      enum: ['customer', 'channel', 'tvshow', 'event', 'podcast', 'admin', 'superadmin'],
      default: 'customer',
      required: true,
    },

    photo: {
      type: Object,
    },

    auth_code: {
      type: Number,
      default: undefined,
    },

    auth_expiry: {
      type: Number,
      default: undefined,
    },

    verified: {
      type: Boolean,
      default: false,
    },

    approved: {
      type: Boolean,
      default: false,
    },

    suspended: {
      type: Boolean,
      default: false,
    },

    gender: {
      type: String,
      enum: ['male', 'female', 'nil'],
    },

    dob: {
      type: Date,
    },

    country: {
      type: String,
      trim: true,
      lowercase: true,
    },
  },
  {
    timestamps: true,

    methods: {
      restricted() {
        const user = this.toObject()

        return {
          ...user,
          auth_code: undefined,
          auth_expiry: undefined,
          approved: undefined,
          suspended: undefined,
          updatedAt: undefined,
          password: undefined,
          pin: undefined,
          __v: undefined,
        }
      },
    },
  },
)

// usersSchema.index({ location: "2dsphere" });

export const UserModel = model('User', usersSchema)
export type UserSchema = InferSchemaType<typeof usersSchema>
export type User = HydratedDocumentFromSchema<typeof usersSchema>
