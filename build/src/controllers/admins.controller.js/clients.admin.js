"use strict";
const PaymentsModel = require('../../models/payments.model');
const UsersModel = require('../../models/users.model');
const { successResponse, serverError } = require('../../utils/response.handler');
exports.getAllClients = async (req, res) => {
    try {
        const limit = req.query.limit || 10;
        const page = req.query.page || 1;
        const clients = await UsersModel.aggregate([
            {
                $match: {
                    $expr: {
                        $or: [
                            {
                                $eq: ['$role', 'tvshow'],
                            },
                            {
                                $eq: ['$role', 'channel'],
                            },
                            {
                                $eq: ['$role', 'podcast'],
                            },
                            {
                                $eq: ['$role', 'event'],
                            },
                        ],
                    },
                },
            },
            {
                $project: {
                    auth_code: 0,
                    auth_expiry: 0,
                    approved: 0,
                    suspended: 0,
                    updatedAt: 0,
                    __v: 0,
                    pin: 0,
                    password: 0,
                },
            },
            {
                $skip: Number(page - 1) * Number(limit) || 0,
            },
            {
                $limit: Number(limit),
            },
        ]);
        return successResponse(res, 200, clients, 'all clients fetched successful');
    }
    catch (error) {
        return serverError(res, 500, null, error.message);
    }
};
exports.getAClient = async (req, res) => {
    try {
        const clients = await UsersModel.aggregate([
            {
                $match: {
                    $expr: {
                        $eq: [
                            '$_id',
                            {
                                $toObjectId: req.params.id,
                            },
                        ],
                    },
                },
            },
            {
                $lookup: {
                    from: 'payments',
                    let: {
                        uid: '$_id',
                    },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: [
                                        '$user_id',
                                        {
                                            $toObjectId: '$$uid',
                                        },
                                    ],
                                },
                            },
                        },
                        {
                            $sort: {
                                createdAt: -1,
                            },
                        },
                    ],
                    as: 'payment history',
                },
            },
            {
                $project: {
                    auth_code: 0,
                    auth_expiry: 0,
                    approved: 0,
                    suspended: 0,
                    updatedAt: 0,
                    __v: 0,
                    pin: 0,
                    password: 0,
                },
            },
        ]);
        return successResponse(res, 200, clients, 'all clients fetched successful');
    }
    catch (error) {
        return serverError(res, 500, null, error.message);
    }
};
exports.clientDeposits = async (req, res) => {
    try {
        const limit = req.query.limit || 10;
        const page = req.query.page || 1;
        const clients = await PaymentsModel.aggregate([
            {
                $match: {},
            },
            {
                $lookup: {
                    from: 'users',
                    let: {
                        uid: '$user_id',
                    },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        {
                                            $eq: [
                                                '$_id',
                                                {
                                                    $toObjectId: '$$uid',
                                                },
                                            ],
                                        },
                                        {
                                            $in: ['$role', ['tvshow', 'channel', 'podcast', 'event']],
                                        },
                                    ],
                                },
                            },
                        },
                        {
                            $project: {
                                role: 1,
                            },
                        },
                    ],
                    as: 'client',
                },
            },
            {
                $match: {
                    $expr: {
                        $ne: ['$client', []],
                    },
                },
            },
            {
                $skip: Number(page - 1) * Number(limit) || 0,
            },
            {
                $limit: Number(limit),
            },
        ]);
        return successResponse(res, 200, clients, 'all clients fetched successful');
    }
    catch (error) {
        return serverError(res, 500, null, error.message);
    }
};
