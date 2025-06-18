import { Types } from 'mongoose'

export type MongoDBObjectId = Types.ObjectId

// attaches an _id property to mongoose.Types.ObjectId 
export type WithMongoDBObjectID<T> = T & { _id: MongoDBObjectId }
