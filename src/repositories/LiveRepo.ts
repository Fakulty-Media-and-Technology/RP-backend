import { FilterQuery } from 'mongoose'
import { LiveModel, LiveSchema } from '../models/lives.model'

export class LiveRepo {
  static getActiveStreamKeys = async () => {
    const liveDocs = await LiveModel.find({ active: true })
    return liveDocs.filter(doc => doc.stream_key != null).map(doc => doc.stream_key) as string[]
  }

  static getChannels = () => LiveModel.find({ type: 'channel' })

  static totalActiveVideosQuery = () => LiveModel.find({ active: true })

  static searchLivesByTextReg = (textReg: RegExp) => {
    return LiveModel.find({
      $or: [
        { title: { $regex: textReg } },
        { sub_title: { $regex: textReg } },
        { description: { $regex: textReg } },
      ],
    })
  }

  static getFeatured = () => {
    return LiveModel.find({
      featured: true,
      expired: false,
    })
  }

  static addFeatured = (id: string, expiry: string) => {
    return LiveModel.findByIdAndUpdate(
      id,
      {
        featured: true,
        feat_expiry: new Date(expiry),
      },
      {
        upsert: true,
      },
    )
  }

  static getActiveById = (id: string) => {
    return LiveModel.findOne({ _id: id, active: true })
  }

  static getSelectedLive = (filter: FilterQuery<LiveSchema>) => {
    return LiveModel.find(filter).select(
      '-__v -client_id -createdAt -updatedAt -sponsored -popular -likes -stream_key',
    )
  }
}
