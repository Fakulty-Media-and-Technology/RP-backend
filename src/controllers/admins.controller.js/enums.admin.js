const CastEnumModel = require("../../models/castEnum.model");
const CategoryEnumModel = require("../../models/categoryEnum.model");
const GenreEnumModels = require("../../models/genreEnum.model");
const {
     successResponse,
     serverError,
} = require("../../utils/response.handler");

exports.addGenre = async (req, res) => {
     try {
          const { name } = req.body;

          const newGenre = new GenreEnumModels({
               name: name,
          });

          await newGenre.save();

          return successResponse(res, 200, null, "new unique genre added");
     } catch (error) {
          return serverError(res, 500, null, error.message);
     }
};

exports.getGenre = async (req, res) => {
     try {
          const genres = await GenreEnumModels.aggregate([
               {
                    $match: {},
               },
          ]);

          return successResponse(res, 200, genres, "genres fetched");
     } catch (error) {
          return serverError(res, 500, null, error.message);
     }
};

exports.remGenre = async (req, res) => {
     try {
          const id = req.params.id;

          await GenreEnumModels.findOneAndDelete({
               _id: id,
          });

          return successResponse(res, 200, null, "genre deleted");
     } catch (error) {
          return serverError(res, 500, null, error.message);
     }
};

//CATEGS
exports.addCategory = async (req, res) => {
     try {
          const { name } = req.body;

          const newCategory = new CategoryEnumModel({
               name: name,
          });

          await newCategory.save();

          return successResponse(res, 200, null, "new unique category added");
     } catch (error) {
          return serverError(res, 500, null, error.message);
     }
};

exports.getCategory = async (req, res) => {
     try {
          const categs = await CategoryEnumModel.aggregate([
               {
                    $match: {},
               },
          ]);

          return successResponse(res, 200, categs, "categories fetched");
     } catch (error) {
          return serverError(res, 500, null, error.message);
     }
};

exports.remCategory = async (req, res) => {
     try {
          const id = req.params.id;

          await CategoryEnumModel.findOneAndDelete({
               _id: id,
          });

          return successResponse(res, 200, null, "category deleted");
     } catch (error) {
          return serverError(res, 500, null, error.message);
     }
};

//CAST
exports.addCast = async (req, res) => {
     try {
          const { name, title } = req.body;

          const newCast = new CastEnumModel({
               name: name,
               title,
          });

          await newCast.save();

          return successResponse(res, 200, null, "new unique cast added");
     } catch (error) {
          return serverError(res, 500, null, error.message);
     }
};

exports.getCast = async (req, res) => {
     try {
          const cast = await CastEnumModel.aggregate([
               {
                    $match: {},
               },
          ]);

          return successResponse(res, 200, cast, "casts fetched");
     } catch (error) {
          return serverError(res, 500, null, error.message);
     }
};

exports.remCast = async (req, res) => {
     try {
          const id = req.params.id;

          await CastEnumModel.findOneAndDelete({
               _id: id,
          });

          return successResponse(res, 200, null, "cast deleted");
     } catch (error) {
          return serverError(res, 500, null, error.message);
     }
};
