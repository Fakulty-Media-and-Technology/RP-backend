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
            Expires: 259200, //3*24*60*60
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
            Expires: 36000,
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

exports.createTranscodingJob = async (sourceUrl, transPart) => {
    return new Promise((resolve, reject) => {
        coconut.Job.create(
            {
                input: { url: sourceUrl },
                outputs: {
                    httpstream: {
                        hls: {
                            path: `${transPart}/hls`,
                            master: true, // Ensure the master playlist is generated
                        },
                        dash: {
                            path: `${transPart}/dash`,
                        },
                        variants: [
                            "mp4:x:64k", // Audio-only stream
                            "mp4:240p::quality=2",
                            "mp4:360p::quality=2",
                            "mp4:480p::quality=3,maxrate=1500k",
                            "mp4:720p::quality=4,maxrate=3000k",
                        ],
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
