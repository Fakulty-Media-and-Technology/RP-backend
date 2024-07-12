const {
     CreateMultipartUploadCommand,
     UploadPartCommand,
     CompleteMultipartUploadCommand,
     AbortMultipartUploadCommand,
     S3Client,
     PutObjectCommand,
} = require("@aws-sdk/client-s3");

function getFileExtension(filename) {
     const parts = filename.split(".");
     return parts.length > 1 ? parts.pop() : "";
}

exports.uploadLargeVideos = async (req, fileHandle, fileKey, expire, res) => {
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
                    Expires: expire ? new Date(expire) : undefined,
                    ContentType: file?.mimetype,
               })
          );

          uploadId = multipartUpload.UploadId;

          const uploadPromises = [];
          const minPartSize = 5 * 1024 * 1024; // 5 MB
          const totalBytes = buffer.length;
          let totalUploadedBytes = 0;

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

          const sortedUploadResults = uploadResults.sort(
               (a, b) => a.PartNumber - b.PartNumber
          );

          const completeResponse = await s3Client.send(
               new CompleteMultipartUploadCommand({
                    Bucket: bucketName,
                    Key: key,
                    UploadId: uploadId,
                    MultipartUpload: {
                         Parts: sortedUploadResults.map(
                              ({ ETag, PartNumber }) => ({
                                   ETag,
                                   PartNumber,
                              })
                         ),
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

exports.uploadShortVideos = async (req, fileHandle, expire, fileKey) => {
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

     try {
          const putObjectCommand = new PutObjectCommand({
               Bucket: bucketName,
               Key: key,
               Body: buffer,
               ContentType: file?.mimetype,
               Expires: expire ? new Date(expire) : undefined,
          });

          const uploadResult = await s3Client.send(putObjectCommand);

          return uploadResult;
     } catch (err) {
          console.error("Error occurred while uploading:", err);
          throw err;
     }
};

exports.uploadImage = async (req, fileHandle, fileKey) => {
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
          ? `photos/${fileKey + "." + getFileExtension(file.name)}`
          : file
            ? `photos/${file.name}`
            : `photos/${Date.now()}`;
     const buffer = file?.data;

     try {
          const putObjectCommand = new PutObjectCommand({
               Bucket: bucketName,
               Key: key,
               Body: buffer,
               ContentType: file.mimetype,
          });

          const resDat = {
               Bucket: putObjectCommand.input.Bucket,
               Key: putObjectCommand.input.Key,
               ContentType: putObjectCommand.input.ContentType,
          };
          const uploadResult = await s3Client.send(putObjectCommand);
          // console.log(uploadResult);

          return resDat;
     } catch (err) {
          console.error("Error occurred while uploading:", err);
          throw err;
     }
};
