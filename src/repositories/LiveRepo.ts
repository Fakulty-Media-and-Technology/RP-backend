import { LiveVideoModel } from "../models/lives.model";

export class LiveVideoRepo {
  static getChannels = () => LiveVideoModel.find({ type: 'channel' })
}
