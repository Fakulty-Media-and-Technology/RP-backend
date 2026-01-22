import { HydratedDocumentFromSchema, InferSchemaType, Schema, model } from 'mongoose'
import { PhotoSchema } from './commonSchema'
import { OperationalError } from '../utils/OperationalError'

const schema = new Schema(
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
      enum: [
        'customer',
        'channel',
        'tvshow',
        'event',
        'podcast',
        'admin',
        'superadmin',
        'giftcard-merchant',
      ],
      default: 'customer',
      required: true,
    },

    photo: PhotoSchema,

    auth_code: {
      type: Number,
    },

    auth_expiry: {
      type: Number,
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

    deleted: {
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

    videoQuality: {
      type: String,
      enum: ['480p', '720p', '1080p'],
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },

    methods: {
      async resetAuthFeilds(save: boolean) {
        this.auth_code = undefined
        this.auth_expiry = undefined

        if (save) {
          await this.save()
        }
      },

      throwIfDeleted(error?: OperationalError) {
        if (this.deleted) {
          throw error ?? new OperationalError('User Not Found', 404)
        }
      },

      restricted() {
        const user = this.toObject()

        return {
          ...user,
          auth_code: undefined,
          auth_expiry: undefined,
          verified: undefined,
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

schema.pre('validate', function (next) {
  if (this.isNew) {
    this.videoQuality = this.role === 'customer' ? '480p' : '720p'
  }

  next()
})

schema.index({ country_code: 1, mobile: 1 }, { unique: true })

export const UserModel = model('users', schema)

export type UserSchema = InferSchemaType<typeof schema>
export type UserDocument = HydratedDocumentFromSchema<typeof schema>
export type UserRole = UserSchema['role']
