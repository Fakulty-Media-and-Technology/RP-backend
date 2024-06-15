const {
    createTranscodingJob,
    readPhotos,
    getVideoUrl,
} = require("../../services/media-access");
const { uploadImage } = require("../../services/media-management");
const {
    successResponse,
    serverError,
    failedResponse,
} = require("../../utils/response.handler");

const {
    S3Client,
    GetObjectCommand,
    ListObjectsV2Command,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { getSignedUrl: getCFSignedUrl } = require("@aws-sdk/cloudfront-signer");

exports.uploadImageRoute = async (req, res) => {
    try {
        const { fileName, fileHandle } = req.body;

        const image = await uploadImage(req, fileHandle, fileName);

        return successResponse(res, 200, image, "image uploaded");
    } catch (error) {
        return serverError(res, 500, null, error.message);
    }
};

exports.customerGetPhotoUrl = async (req, res) => {
    try {
        const user = req.user;

        const { bucket, key } = req.body;

        const image = await readPhotos(bucket, key);

        return successResponse(res, 200, image, "image fetched");
    } catch (error) {
        return serverError(res, 500, null, error.message);
    }
};

// exports.customerGetVideoUrl = async (req, res) => {
//     try {
//         const user = req.user;

//         const { bucket, key } = req.body;

//         const image = await readPhotos(bucket, key);

//         return successResponse(res, 200, image, "image fetched");
//     } catch (error) {
//         return serverError(res, 500, null, error.message);
//     }
// };

const s3Client = new S3Client({
    region: process.env.S3REGION,
    credentials: {
        accessKeyId: process.env.S3ACCESS_KEY,
        secretAccessKey: process.env.S3SECRET_KEY,
    },
});

exports.vodStream = async (req, res) => {
    try {
        const { bucket, key } = req.body;

        const transPath = `s3://reeplay/transcode/${key
            .split("/")
            .slice(1)
            .join("/")}`;

        const params = {
            Bucket: bucket,
            Prefix: `transcode/${key.split("/").slice(1).join("/")}/`,
            MaxKeys: 1,
        };

        const data = await s3Client.send(new ListObjectsV2Command(params));

        // console.log(data.Contents);
        const checkTranscodedFolder = data.Contents?.length > 0;

        if (checkTranscodedFolder != true) {
            // const url = await getVideoUrl(bucket, key);
            // console.log(url);

            const filePath = `s3://reeplay/${key}`;

            await createTranscodingJob(filePath, transPath);

            return failedResponse(
                res,
                500,
                null,
                "Oops, check back in few minutes, wait while the video is being transcoded"
            );
        }
        console.log("all good, video already trancoded");

        // access transcoded files with cloudfront
        const signedUrl = getCFSignedUrl({
            keyPairId: process.env.CLOUDFRONT_KEYPAIR_ID,
            privateKey: process.env.CLOUDFRONT_PRIVATE_KEY,
            url: `${process.env.CFSDISTRIBUTION}/transcode/${key
                .split("/")
                .slice(1)
                .join("/")}/${key.split("/").slice(1).join("/")}_480p.mp3`,
            dateLessThan: new Date(Date.now() + 1000 /*sec*/ * 60),
        });

        return successResponse(
            res,
            200,
            {
                video_content: signedUrl,
            },
            "video streaming"
        );
    } catch (error) {
        return serverError(res, 500, null, error.message);
    }
};

//res hook processing
const bucketName = process.env.S3BUCKET;
const expirationTime = 3600; // URL expiration time in seconds

const generateSignedUrl = async (key) => {
    const params = {
        Bucket: bucketName,
        Key: key,
    };
    const command = new GetObjectCommand(params);
    const signedUrl = await getSignedUrl(s3Client, command, {
        expiresIn: expirationTime,
    });
    return signedUrl;
};

let DB = {};

exports.trancodeResHook = async (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const notification = req.body;

    if (notification.event === "job.completed") {
        // Handle the completed job notification
        console.log("Job completed:", notification);

        const outputs = notification.data.outputs;
        const resultUrls = {};

        // for (const output of outputs) {
        //     if (output.type === "video") {
        //         const key = new URL(output.url).pathname.substring(1);
        //         resultUrls[output.key] = await generateSignedUrl(key);
        //     } else if (
        //         output.type === "image" ||
        //         output.type === "httpstream"
        //     ) {
        //         const signedUrls = await Promise.all(
        //             output.urls.map(async (url) => {
        //                 const key = new URL(url).pathname.substring(1);
        //                 return generateSignedUrl(key);
        //             })
        //         );
        //         resultUrls[output.key] = signedUrls;
        //     }
        // }

        // // Store the resultUrls in your DB or perform other operations
        // DB[notification.data.id] = resultUrls;

        // console.log("Result URLs:", resultUrls);
    } else if (notification.event === "job.error") {
        // Handle the error notification
        console.error("Job error:", notification);
    } else {
        console.log(
            "Received event:",
            notification,
            notification?.data?.outputs
        );
    }

    // res.sendStatus(200);
};

exports.checkandGetResHook = (req, res) => {
    try {
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        res.flushHeaders();

        const hook_id = req.params.id;

        const checkForData = () => {
            if (DB[hook_id]) {
                res.write(`data: ${JSON.stringify(DB[hook_id])}\n\n`);
                res.end(); // Close the connection after sending the data
            }
        };

        // Check immediately in case the data is already available
        checkForData();

        // Periodically check for user data
        const interval = setInterval(checkForData, 2000); // Check every 5 seconds

        // Cleanup on client disconnect
        req.on("close", () => {
            clearInterval(interval);
            res.end();
        });
    } catch (error) {
        return serverError(res, 500, null, error.message);
    }
};
