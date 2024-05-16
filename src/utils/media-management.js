const {
    CreateMultipartUploadCommand,
    UploadPartCommand,
    CompleteMultipartUploadCommand,
    AbortMultipartUploadCommand,
    S3Client,
} = require("@aws-sdk/client-s3");

exports.uploadLargeVideos = async (req, fileHandle, fileKey, res) => {
    if (!req.files) return false;
    if (!req.files[fileHandle]) return false;
    let file = { ...req.files[fileHandle] };

    const s3Client = new S3Client({
        region: process.env.S3REGION,
        credentials: {
            accessKeyId: process.env.S3ACCESS_KEY,
            secretAccessKey: process.env.S3SECRET_KEY,
        },
    });

    const bucketName = "reeplay";
    const key = fileKey
        ? `videos/${fileKey}`
        : file
        ? `videos/${file.name}`
        : `videos/${Date.now()}`;
    const buffer = file?.data;

    let uploadId;

    try {
        // Create multipart upload
        const multipartUpload = await s3Client.send(
            new CreateMultipartUploadCommand({
                Bucket: bucketName,
                Key: key,
                ContentType: file.mimetype,
            })
        );

        uploadId = multipartUpload.UploadId;

        const uploadPromises = [];
        const minPartSize = 5 * 1024 * 1024; // 5 MB
        const totalBytes = buffer.length;
        let totalUploadedBytes = 0;

        console.log(uploadPromises);
        for (
            let start = 0, partNumber = 1;
            start < totalBytes;
            start += minPartSize, partNumber++
        ) {
            const end = Math.min(start + minPartSize, totalBytes);
            const partBuffer = buffer.subarray(start, end);

            const uploadPromise = s3Client
                .send(
                    new UploadPartCommand({
                        Bucket: bucketName,
                        Key: key,
                        UploadId: uploadId,
                        Body: partBuffer,
                        PartNumber: partNumber,
                    })
                )
                .then((uploadResult) => {
                    totalUploadedBytes += partBuffer.length;
                    const percentage = (
                        (totalUploadedBytes / totalBytes) *
                        100
                    ).toFixed(2);

                    res.write(
                        `data: ${JSON.stringify({
                            status: `${percentage}%`,
                        })}\n\n`
                    );

                    console.log(
                        `Part ${partNumber} - Uploaded: ${percentage}%`
                    );
                    return {
                        ETag: uploadResult.ETag,
                        PartNumber: partNumber,
                    };
                });

            uploadPromises.push(uploadPromise);
        }

        const uploadResults = await Promise.all(uploadPromises);
        console.log("All parts uploaded successfully.");

        // Ensure parts are sorted by PartNumber
        const sortedUploadResults = uploadResults.sort(
            (a, b) => a.PartNumber - b.PartNumber
        );
        console.log(sortedUploadResults);
        const completeResponse = await s3Client.send(
            new CompleteMultipartUploadCommand({
                Bucket: bucketName,
                Key: key,
                UploadId: uploadId,
                MultipartUpload: {
                    Parts: sortedUploadResults.map(({ ETag, PartNumber }) => ({
                        ETag,
                        PartNumber,
                    })),
                },
            })
        );

        console.log("Multipart upload completed successfully.");
        res.write(
            `data: ${JSON.stringify({
                status: "completed",
                data: completeResponse,
            })}\n\n`
        );
        res.end();
        return completeResponse;
    } catch (err) {
        console.error("Error occurred:", err);

        if (uploadId) {
            const abortCommand = new AbortMultipartUploadCommand({
                Bucket: bucketName,
                Key: key,
                UploadId: uploadId,
            });

            await s3Client.send(abortCommand);
            console.log("Multipart upload aborted.");
        }
    }
};

// exports.uploadShortVideos = async (req, fileHandle, fileName) => {
//     if (!req.files) return false;
//     if (!req.files[fileHandle]) return false;
//     let file = { ...req.files[fileHandle] };

//     const s3Client = new S3Client({
//         region: process.env.S3REGION,
//         credentials: {
//             accessKeyId: process.env.S3ACCESS_KEY,
//             secretAccessKey: process.env.S3SECRET_KEY,
//         },
//     });

//     const bucketName = "reeplay";
//     const key = file.name;
//     const buffer = Buffer.from(file.data);

//     console.log(file, Buffer.from(file.tempFilePath));

//     let uploadId;

//     try {
//         const multipartUpload = await s3Client.send(
//             new CreateMultipartUploadCommand({
//                 Bucket: bucketName,
//                 Key: key,
//             })
//         );

//         uploadId = multipartUpload.UploadId;

//         const uploadPromises = [];
//         // Multipart uploads require a minimum size of 5 MB per part.
//         const minPart = 5 * 1024 * 1024;
//         // const partSize =

//         // Upload each part.
//         for (let i = 0; i < 5; i++) {
//             const start = i * partSize;
//             const end = start + partSize;
//             uploadPromises.push(
//                 s3Client
//                     .send(
//                         new UploadPartCommand({
//                             Bucket: bucketName,
//                             Key: key,
//                             UploadId: uploadId,
//                             Body: buffer.subarray(start, end),
//                             PartNumber: i + 1,
//                         })
//                     )
//                     .then((d) => {
//                         console.log("Part", i + 1, "uploaded");
//                         return d;
//                     })
//             );
//         }

//         const uploadResults = await Promise.all(uploadPromises);

//         return await s3Client.send(
//             new CompleteMultipartUploadCommand({
//                 Bucket: bucketName,
//                 Key: key,
//                 UploadId: uploadId,
//                 MultipartUpload: {
//                     Parts: uploadResults.map(({ ETag }, i) => ({
//                         ETag,
//                         PartNumber: i + 1,
//                     })),
//                 },
//             })
//         );

//         // Verify the output by downloading the file from the Amazon Simple Storage Service (Amazon S3) console.
//         // Because the output is a 25 MB string, text editors might struggle to open the file.
//     } catch (err) {
//         console.error(err);

//         if (uploadId) {
//             const abortCommand = new AbortMultipartUploadCommand({
//                 Bucket: bucketName,
//                 Key: key,
//                 UploadId: uploadId,
//             });

//             await s3Client.send(abortCommand);
//         }
//     }
// };
