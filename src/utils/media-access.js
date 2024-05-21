const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const Coconut = require("coconutjs");

exports.readPhotos = async (bucket, key) => {
    try {
        const client = new S3Client({
            region: process.env.S3REGION,
            credentials: {
                accessKeyId: process.env.S3ACCESS_KEY,
                secretAccessKey: process.env.S3SECRET_KEY,
            },
        });

        const params = {
            Bucket: bucket,
            Expires: 3600,
            Key: key,
        };

        const command = new GetObjectCommand(params);

        const signed = await getSignedUrl(client, command);

        return signed;
    } catch (error) {
        return {
            status: 400,
            message: error.message,
        };
    }
};

exports.getVideoUrl = async (bucket, key) => {
    try {
        const client = new S3Client({
            region: process.env.S3REGION,
            credentials: {
                accessKeyId: process.env.S3ACCESS_KEY,
                secretAccessKey: process.env.S3SECRET_KEY,
            },
        });

        const params = {
            Bucket: bucket,
            Expires: 3600,
            Key: key,
        };

        const command = new GetObjectCommand(params);

        const signed = await getSignedUrl(client, command);

        return signed;
    } catch (error) {
        return {
            status: 400,
            message: error.message,
        };
    }
};

const coconut = new Coconut.Client(process.env.COCONUT_API_KEY);

coconut.notification = {
    type: "http",
    url: process.env.NOTIFICATION_URL,
};

coconut.storage = {
    service: "s3",
    bucket: process.env.S3BUCKET,
    region: process.env.S3REGION,
    credentials: {
        access_key_id: process.env.S3ACCESS_KEY,
        secret_access_key: process.env.S3SECRET_KEY,
    },
    acl: "private",
};

exports.createTranscodingJob = async (sourceUrl) => {
    return new Promise((resolve, reject) => {
        coconut.Job.create(
            {
                input: { url: sourceUrl },
                outputs: {
                    mp4: {
                        key: "mp4",
                        path: "/transcode/video.mp4",
                        format: {
                            quality: 4,
                        },
                    },
                    "jpg:300x": {
                        key: "jpg",
                        number: 3,
                        path: "/transcode/thumbnails/thumb_%04d.jpg",
                    },
                },
            },
            (job, err) => {
                if (err) return reject(err);
                resolve(job);
            }
        );
    });
};
