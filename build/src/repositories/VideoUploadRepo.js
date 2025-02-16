"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.VideoUploadRepo = void 0;
const videoupload_model_1 = require("../models/videoupload.model");
const OperationalError_1 = require("../utils/OperationalError");
class VideoUploadRepo {
}
exports.VideoUploadRepo = VideoUploadRepo;
_a = VideoUploadRepo;
VideoUploadRepo.updateWithParent = async (input) => {
    const update = await videoupload_model_1.VideoUploadModel.findOneAndUpdate({
        _id: input.id,
        parentId: { $exists: false },
        parentType: { $exists: false },
    }, {
        $set: {
            parentId: input.parentId,
            parentType: input.parentType,
        },
    }, { session: input.session, new: true });
    // E get y
    if (update == null) {
        throw new OperationalError_1.OperationalError('invalid video_upload id or video upload is already assigned to a parent', 400);
    }
    return update;
};
