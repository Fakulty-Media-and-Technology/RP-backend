import { LiveRepo } from '../../repositories/LiveRepo'

export class LiveService {
  static searchByText = async (text: string) =>
    await LiveRepo.searchLivesByTextReg(new RegExp(text, 'i'))

  static getFeatured = async () => await LiveRepo.getFeatured()

  static addFeatured = async (id: string, expiry: string) =>
    await LiveRepo.addFeatured(id, expiry)
}
