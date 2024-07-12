// ....
const UpcomingModel = require("../../models/upcoming.model");
const {
    successResponse,
    serverError,
    failedResponse,
    invalidRequest,
} = require("../../utils/response.handler");


exports.createUpcomingEvent = async (req, res) => {
    try {
        const { title, type, details, release_date, portrait_photo, landscape_photo } = req.body;

        if(!title || !type || !details, !release_date || !portrait_photo || !landscape_photo) {
            return invalidRequest(res, 400, null, "all details are required");
        }

        const upcomingEvent = new UpcomingModel({
            title: title,
            type: type,
            details: details,
            release_date: new Date(release_date),
            portrait_photo: portrait_photo,
            landscape_photo: landscape_photo
        })

        await upcomingEvent.save();

        return successResponse(
            res,
            200,
            null,
            "new upcoming event created"
        );
    } catch (error) {
        return serverError(res, 500, null, error.message);
    }
}