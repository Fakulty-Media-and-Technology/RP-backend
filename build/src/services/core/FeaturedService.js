"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeaturedService = void 0;
const VideoService_1 = require("./VideoService");
class FeaturedService {
}
exports.FeaturedService = FeaturedService;
_a = FeaturedService;
FeaturedService.searchVideosByText = async (text) => {
    const [vods, events] = await Promise.all([
        VideoService_1.VideoService.searceByText(text),
        VideoService_1.VideoService.Live.searchByText(text),
    ]);
    return { vods, events };
};
FeaturedService.addFeatured = async ({ id, type, expiry }) => {
    if (type === 'vod') {
        await VideoService_1.VideoService.addFeatured(id, expiry);
        return;
    }
    await VideoService_1.VideoService.Live.addFeatured(id, expiry);
};
FeaturedService.getFeaturedContents = async () => {
    const [vods, events] = await Promise.all([
        VideoService_1.VideoService.getFeaturedVideos(),
        VideoService_1.VideoService.Live.getFeatured(),
    ]);
    return {
        vods_contents: vods,
        lives_contents: events,
    };
};
