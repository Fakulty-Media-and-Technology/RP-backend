"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SharedRoutes = void 0;
const shared_controller_1 = require("../controllers/common/shared.controller");
const Multer_1 = require("../utils/Multer");
const requestValidator_1 = require("../middlewares/requestValidator");
const common_1 = require("../validations/common");
class SharedRoutes {
    constructor(router) {
        this._baseRouter = router;
    }
    livesRoutes(caller) {
        this._baseRouter.post('/lives/create', Multer_1.Multer.createLiveConfig, shared_controller_1.SharedController.createLive({ isAdmin: caller === 'Admin' }));
        return this;
    }
    fetchSubtitles() {
        this._baseRouter.get('/subtitles/fetch/:parentId', shared_controller_1.SharedController.getSubtitles);
        return this;
    }
    updateUserProfile(authType) {
        this._baseRouter.put('/user-profile/shared/update/:userId', Multer_1.Multer.uploadSingleImage, (0, requestValidator_1.requestValidator)(common_1.updateUserProfileSchema), shared_controller_1.SharedController.updateProfile(authType));
        return this;
    }
}
exports.SharedRoutes = SharedRoutes;
