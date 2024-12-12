import { AdmanagerSchema, AdmanagerModel } from '../models/admanager.model'

export class AdManagerRepo {
  static create = (data: Partial<AdmanagerSchema>) => AdmanagerModel.create(data)

  static deletedAdd = (addId: string) => AdmanagerModel.findByIdAndDelete(addId)

  static getAdds = () => AdmanagerModel.find({})
}
