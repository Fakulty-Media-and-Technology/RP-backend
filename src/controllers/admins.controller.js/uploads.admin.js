const PosterModel = require("../../models/poster.model");
const VideosModel = require("../../models/videos.model");
const {
     serverError,
     successResponse,
     invalidRequest,
} = require("../../utils/response.handler");

//MOVIES
exports.addMovie = async (req, res) => {
     try {
          const admin = req.user;
          const {
               title,
               sub_title,
               bucket,
               key,
               pg,
               vid_class,
               genre,
               category,
               cast,
               released_date,
               expiry_date,
               runtime,
               default_rating,
               poster1_data,
               poster2_data,
          } = req.body;

          if (
               !title ||
               !bucket ||
               !key ||
               !pg ||
               !vid_class ||
               !genre ||
               !category ||
               !cast ||
               !released_date ||
               !runtime ||
               !default_rating
          ) {
               return invalidRequest(
                    res,
                    400,
                    null,
                    "all required fields are mandatory"
               );
          }

          if (!poster1_data.key || !poster1_data.dimension) {
               return invalidRequest(
                    res,
                    400,
                    null,
                    "video poster details are required"
               );
          }

          if (!poster2_data.key || !poster2_data.dimension) {
               return invalidRequest(
                    res,
                    400,
                    null,
                    "video poster details are required"
               );
          }

          const videoData = await new VideosModel({
               admin_id: admin._id,
               title,
               sub_title,
               type: "movie",
               bucket,
               key,
               pg,
               vid_class,
               genre,
               category,
               cast,
               released_date,
               expiry_date,
               runtime,
               default_rating,
               is_series: false,
          }).save();

          await new PosterModel({
               video_id: videoData._id,
               bucket: poster1_data.bucket,
               key: poster1_data.key,
               dimension: poster1_data.dimension,
          }).save();

          await new PosterModel({
               video_id: videoData._id,
               bucket: poster2_data.bucket,
               key: poster2_data.key,
               dimension: poster2_data.dimension,
          }).save();

          return successResponse(res, 200, null, "movie added successfully");
     } catch (error) {
          return serverError(res, 500, null, error.message);
     }
};

exports.editMovie = async (req, res) => {
     try {
          const vid_id = req.params.id;
          const {
               title,
               sub_title,
               bucket,
               key,
               pg,
               vid_class,
               genre,
               category,
               cast,
               released_date,
               expiry_date,
               runtime,
               default_rating,
          } = req.body;

          const initData = await VideosModel.findOne({ _id: vid_id });

          await VideosModel.findOneAndUpdate(
               {
                    _id: vid_id,
                    type: "movie",
               },
               {
                    title: title ? title : initData?.title,
                    sub_title: sub_title ? sub_title : initData?.sub_title,
                    bucket: bucket ? bucket : initData?.bucket,
                    key: key ? key : initData?.key,
                    pg: pg ? pg : initData?.pg,
                    vid_class: vid_class ? vid_class : initData?.class,
                    genre: genre ? genre : initData?.genre,
                    category: category ? category : initData?.category,
                    cast: cast ? cast : initData?.cast,
                    released_date: released_date
                         ? released_date
                         : initData?.released_date,
                    expiry_date: expiry_date
                         ? expiry_date
                         : initData?.expiry_date,
                    runtime: runtime ? runtime : initData?.runtime,
                    default_rating: default_rating
                         ? default_rating
                         : initData?.default_rating,
               },
               {
                    new: true,
               }
          );

          return successResponse(res, 200, null, "movie updated successfully");
     } catch (error) {
          return serverError(res, 500, null, error.message);
     }
};

exports.deleteMovie = async (req, res) => {
     try {
          const vid_id = req.params.id;

          //TODO delete S3 objecttsss

          // await VideosModel.findOneAndDelete({_id: vid_id})
          return successResponse(
               res,
               200,
               null,
               "TODO: movie deleted successfully"
          );
     } catch (error) {
          return serverError(res, 500, null, error.message);
     }
};

exports.fetchMovies = async (req, res) => {
     try {
          const limit = req.querylimit || 10;
          const page = req.query.page || 1;

          const videos = await VideosModel.aggregate([
               {
                    $match: {
                         $expr: {
                              $eq: ["$type", "movie"],
                         },
                    },
               },
               {
                    $project: {
                         __v: 0,
                         createdAt: 0,
                         updatedAt: 0,
                    },
               },
               {
                    $sort: {
                         updatedAt: 1,
                    },
               },
               {
                    $skip: Number(page - 1) * Number(limit) || 0,
               },
               {
                    $limit: Number(limit),
               },
          ]);

          return successResponse(
               res,
               200,
               videos,
               "movies fetched successfully"
          );
     } catch (error) {
          return serverError(res, 500, null, error.message);
     }
};

//SKITS
exports.addSkit = async (req, res) => {
     try {
          const admin = req.user;
          const {
               title,
               sub_title,
               bucket,
               key,
               pg,
               vid_class,
               genre,
               category,
               cast,
               released_date,
               expiry_date,
               runtime,
               default_rating,
               poster1_data,
               poster2_data,
          } = req.body;

          if (
               !title ||
               !bucket ||
               !key ||
               !pg ||
               !vid_class ||
               !genre ||
               !category ||
               !cast ||
               !released_date ||
               !runtime ||
               !default_rating
          ) {
               return invalidRequest(
                    res,
                    400,
                    null,
                    "all required fields are mandatory"
               );
          }

          if (!poster1_data.key || !poster1_data.dimension) {
               return invalidRequest(
                    res,
                    400,
                    null,
                    "video poster details are required"
               );
          }

          if (!poster2_data.key || !poster2_data.dimension) {
               return invalidRequest(
                    res,
                    400,
                    null,
                    "video poster details are required"
               );
          }

          const videoData = await new VideosModel({
               admin_id: admin._id,
               title,
               sub_title,
               type: "skit",
               bucket,
               key,
               pg,
               vid_class,
               genre,
               category,
               cast,
               released_date,
               expiry_date,
               runtime,
               default_rating,
               is_series: false,
          }).save();

          await new PosterModel({
               video_id: videoData._id,
               bucket: poster1_data.bucket,
               key: poster1_data.key,
               dimension: poster1_data.dimension,
          }).save();

          await new PosterModel({
               video_id: videoData._id,
               bucket: poster2_data.bucket,
               key: poster2_data.key,
               dimension: poster2_data.dimension,
          }).save();

          return successResponse(res, 200, null, "skit added successfully");
     } catch (error) {
          return serverError(res, 500, null, error.message);
     }
};

exports.editSkit = async (req, res) => {
     try {
          const vid_id = req.params.id;
          const {
               title,
               sub_title,
               bucket,
               key,
               pg,
               vid_class,
               genre,
               category,
               cast,
               released_date,
               expiry_date,
               runtime,
               default_rating,
          } = req.body;

          const initData = await VideosModel.findOne({ _id: vid_id });

          await VideosModel.findOneAndUpdate(
               {
                    _id: vid_id,
                    type: "skit",
               },
               {
                    title: title ? title : initData?.title,
                    sub_title: sub_title ? sub_title : initData?.sub_title,
                    bucket: bucket ? bucket : initData?.bucket,
                    key: key ? key : initData?.key,
                    pg: pg ? pg : initData?.pg,
                    vid_class: vid_class ? vid_class : initData?.class,
                    genre: genre ? genre : initData?.genre,
                    category: category ? category : initData?.category,
                    cast: cast ? cast : initData?.cast,
                    released_date: released_date
                         ? released_date
                         : initData?.released_date,
                    expiry_date: expiry_date
                         ? expiry_date
                         : initData?.expiry_date,
                    runtime: runtime ? runtime : initData?.runtime,
                    default_rating: default_rating
                         ? default_rating
                         : initData?.default_rating,
               },
               {
                    new: true,
               }
          );

          return successResponse(res, 200, null, "skit updated successfully");
     } catch (error) {
          return serverError(res, 500, null, error.message);
     }
};

exports.deleteSkit = async (req, res) => {
     try {
          const vid_id = req.params.id;

          //TODO delete S3 objecttsss

          // await VideosModel.findOneAndDelete({_id: vid_id})
          return successResponse(res, 200, null, "TODO");
     } catch (error) {
          return serverError(res, 500, null, error.message);
     }
};

exports.fetchSkits = async (req, res) => {
     try {
          const limit = req.querylimit || 10;
          const page = req.query.page || 1;

          const videos = await VideosModel.aggregate([
               {
                    $match: {
                         $expr: {
                              $eq: ["$type", "skit"],
                         },
                    },
               },
               {
                    $project: {
                         __v: 0,
                         createdAt: 0,
                         updatedAt: 0,
                    },
               },
               {
                    $sort: {
                         updatedAt: 1,
                    },
               },
               {
                    $skip: Number(page - 1) * Number(limit) || 0,
               },
               {
                    $limit: Number(limit),
               },
          ]);

          return successResponse(
               res,
               200,
               videos,
               "skits fetched successfully"
          );
     } catch (error) {
          return serverError(res, 500, null, error.message);
     }
};

//Music Videos
exports.addMusicVid = async (req, res) => {
     try {
          const admin = req.user;
          const {
               title,
               sub_title,
               bucket,
               key,
               pg,
               vid_class,
               category,
               released_date,
               expiry_date,
               runtime,
               default_rating,
               artist_name,
               poster1_data,
               poster2_data,
          } = req.body;

          if (
               !title ||
               !bucket ||
               !key ||
               !pg ||
               !vid_class ||
               !category ||
               !released_date ||
               !runtime ||
               !artist_name ||
               !default_rating
          ) {
               return invalidRequest(
                    res,
                    400,
                    null,
                    "all required fields are mandatory"
               );
          }

          if (!poster1_data.key || !poster1_data.dimension) {
               return invalidRequest(
                    res,
                    400,
                    null,
                    "video poster details are required"
               );
          }

          if (!poster2_data.key || !poster2_data.dimension) {
               return invalidRequest(
                    res,
                    400,
                    null,
                    "video poster details are required"
               );
          }

          const videoData = await new VideosModel({
               admin_id: admin._id,
               title,
               sub_title,
               type: "music video",
               bucket,
               key,
               pg,
               vid_class,
               category,
               artist_name,
               released_date,
               expiry_date,
               runtime,
               default_rating,
               is_series: false,
          }).save();

          await new PosterModel({
               video_id: videoData._id,
               bucket: poster1_data.bucket,
               key: poster1_data.key,
               dimension: poster1_data.dimension,
          }).save();

          await new PosterModel({
               video_id: videoData._id,
               bucket: poster2_data.bucket,
               key: poster2_data.key,
               dimension: poster2_data.dimension,
          }).save();

          return successResponse(
               res,
               200,
               null,
               "Music Video added successfully"
          );
     } catch (error) {
          return serverError(res, 500, null, error.message);
     }
};

exports.editMusicVid = async (req, res) => {
     try {
          const vid_id = req.params.id;
          const {
               title,
               sub_title,
               bucket,
               key,
               pg,
               vid_class,
               artist_name,
               category,
               released_date,
               expiry_date,
               runtime,
               default_rating,
          } = req.body;

          const initData = await VideosModel.findOne({ _id: vid_id });

          await VideosModel.findOneAndUpdate(
               {
                    _id: vid_id,
                    type: "music video",
               },
               {
                    title: title ? title : initData?.title,
                    sub_title: sub_title ? sub_title : initData?.sub_title,
                    bucket: bucket ? bucket : initData?.bucket,
                    key: key ? key : initData?.key,
                    pg: pg ? pg : initData?.pg,
                    vid_class: vid_class ? vid_class : initData?.class,
                    category: category ? category : initData?.category,
                    artist_name: artist_name
                         ? artist_name
                         : initData?.artist_name,
                    released_date: released_date
                         ? released_date
                         : initData?.released_date,
                    expiry_date: expiry_date
                         ? expiry_date
                         : initData?.expiry_date,
                    runtime: runtime ? runtime : initData?.runtime,
                    default_rating: default_rating
                         ? default_rating
                         : initData?.default_rating,
               },
               {
                    new: true,
               }
          );

          return successResponse(
               res,
               200,
               null,
               "Music Video updated successfully"
          );
     } catch (error) {
          return serverError(res, 500, null, error.message);
     }
};

exports.deleteMusicVid = async (req, res) => {
     try {
          const vid_id = req.params.id;

          //TODO delete S3 objecttsss

          // await VideosModel.findOneAndDelete({_id: vid_id})
          return successResponse(res, 200, null, "TODO");
     } catch (error) {
          return serverError(res, 500, null, error.message);
     }
};

exports.fetchMusicVid = async (req, res) => {
     try {
          const limit = req.querylimit || 10;
          const page = req.query.page || 1;

          const videos = await VideosModel.aggregate([
               {
                    $match: {
                         $expr: {
                              $eq: ["$type", "music_video"],
                         },
                    },
               },
               {
                    $project: {
                         __v: 0,
                         createdAt: 0,
                         updatedAt: 0,
                    },
               },
               {
                    $sort: {
                         updatedAt: 1,
                    },
               },
               {
                    $skip: Number(page - 1) * Number(limit) || 0,
               },
               {
                    $limit: Number(limit),
               },
          ]);

          return successResponse(
               res,
               200,
               videos,
               "Music Video fetched successfully"
          );
     } catch (error) {
          return serverError(res, 500, null, error.message);
     }
};

//Series
exports.addSeries = async (req, res) => {
     try {
          const admin = req.user;
          const {
               title,
               sub_title,
               pg,
               vid_class,
               category,
               genre,
               cast,
               released_date,
               expiry_date,
               runtime,
               episodes,
               default_rating,
               poster1_data,
               poster2_data,
          } = req.body;

          if (
               !title ||
               !pg ||
               !vid_class ||
               !category ||
               !genre ||
               !cast ||
               !released_date ||
               !runtime ||
               !episodes ||
               !default_rating
          ) {
               return invalidRequest(
                    res,
                    400,
                    req.body,
                    "all required fields are mandatory"
               );
          }

          if (!poster1_data.key || !poster1_data.dimension) {
               return invalidRequest(
                    res,
                    400,
                    null,
                    "video poster details are required"
               );
          }

          if (!poster2_data.key || !poster2_data.dimension) {
               return invalidRequest(
                    res,
                    400,
                    null,
                    "video poster details are required"
               );
          }

          const videoData = await new VideosModel({
               admin_id: admin._id,
               title,
               sub_title,
               type: "series",
               pg,
               vid_class,
               category,
               released_date,
               expiry_date,
               runtime,
               default_rating,
               is_series: true,
               episodes,
          }).save();

          await new PosterModel({
               video_id: videoData._id,
               bucket: poster1_data.bucket,
               key: poster1_data.key,
               dimension: poster1_data.dimension,
          }).save();

          await new PosterModel({
               video_id: videoData._id,
               bucket: poster2_data.bucket,
               key: poster2_data.key,
               dimension: poster2_data.dimension,
          }).save();

          return successResponse(res, 200, null, "Series added successfully");
     } catch (error) {
          return serverError(res, 500, null, error.message);
     }
};

exports.editSeries = async (req, res) => {
     try {
          const vid_id = req.params.id;
          const {
               title,
               sub_title,
               pg,
               vid_class,
               category,
               genre,
               cast,
               released_date,
               expiry_date,
               runtime,
               episodes,
               default_rating,
          } = req.body;

          const initData = await VideosModel.findOne({ _id: vid_id });

          await VideosModel.findOneAndUpdate(
               {
                    _id: vid_id,
                    type: "series",
               },
               {
                    title: title ? title : initData?.title,
                    sub_title: sub_title ? sub_title : initData?.sub_title,
                    pg: pg ? pg : initData?.pg,
                    vid_class: vid_class ? vid_class : initData?.class,
                    category: category ? category : initData?.category,
                    genre: genre ? genre : initData?.genre,
                    cast: cast ? cast : initData?.cast,
                    episodes: episodes ? episodes : initData?.episodes,
                    released_date: released_date
                         ? released_date
                         : initData?.released_date,
                    expiry_date: expiry_date
                         ? expiry_date
                         : initData?.expiry_date,
                    runtime: runtime ? runtime : initData?.runtime,
                    default_rating: default_rating
                         ? default_rating
                         : initData?.default_rating,
               },
               {
                    new: true,
               }
          );

          return successResponse(res, 200, null, "Series updated successfully");
     } catch (error) {
          return serverError(res, 500, null, error.message);
     }
};

exports.deleteSeries = async (req, res) => {
     try {
          const vid_id = req.params.id;

          //TODO delete S3 objecttsss

          // await VideosModel.findOneAndDelete({_id: vid_id})
          return successResponse(res, 200, null, "TODO");
     } catch (error) {
          return serverError(res, 500, null, error.message);
     }
};

exports.fetchSeries = async (req, res) => {
     try {
          const limit = req.querylimit || 10;
          const page = req.query.page || 1;

          const videos = await VideosModel.aggregate([
               {
                    $match: {
                         $expr: {
                              $eq: ["$type", "series"],
                         },
                    },
               },
               {
                    $project: {
                         __v: 0,
                         createdAt: 0,
                         updatedAt: 0,
                    },
               },
               {
                    $sort: {
                         updatedAt: 1,
                    },
               },
               {
                    $skip: Number(page - 1) * Number(limit) || 0,
               },
               {
                    $limit: Number(limit),
               },
          ]);

          return successResponse(
               res,
               200,
               videos,
               "Series fetched successfully"
          );
     } catch (error) {
          return serverError(res, 500, null, error.message);
     }
};
