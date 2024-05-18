const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

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
            Expires: 60,
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
