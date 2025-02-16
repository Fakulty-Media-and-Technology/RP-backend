"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SharedRoutes = void 0;
const media_controller_1 = require("../controllers/common/media.controller");
const Multer_1 = require("../utils/Multer");
class SharedRoutes {
    constructor(router) {
        this._baseRouter = router;
    }
    livesRoutes(caller) {
        this._baseRouter.post('/lives/create', Multer_1.Multer.createLiveConfig, media_controller_1.MediaController.createLive({ isAdmin: caller === 'Admin' }));
        return this;
    }
    fetchSubtitles() {
        this._baseRouter.get('/subtitles/fetch/:parentId', media_controller_1.MediaController.getSubtitles);
        return this;
    }
}
exports.SharedRoutes = SharedRoutes;
