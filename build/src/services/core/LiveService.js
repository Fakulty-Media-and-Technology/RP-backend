"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LiveService = void 0;
const LiveRepo_1 = require("../../repositories/LiveRepo");
class LiveService {
}
exports.LiveService = LiveService;
_a = LiveService;
LiveService.searchByText = async (text) => await LiveRepo_1.LiveRepo.searchLivesByTextReg(new RegExp(text, 'i'));
LiveService.getFeatured = async () => await LiveRepo_1.LiveRepo.getFeatured();
LiveService.addFeatured = async (id, expiry) => await LiveRepo_1.LiveRepo.addFeatured(id, expiry);
