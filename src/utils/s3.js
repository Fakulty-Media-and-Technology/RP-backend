// const fs = require('fs');
// var AWS = require('aws-sdk');
// const config = require('./../config/config')
// let s3bucket = new AWS.S3({
//     accessKeyId: config.IAM_USER_KEY,
//     secretAccessKey: config.IAM_USER_SECRET,
//     Bucket: config.BUCKET_NAME
// });

// exports.uploadFile = async (file, type) => {
//     return new Promise(async (resolve, reject) => {
//         console.log(file)
//         const fileContent = file.path ? fs.readFileSync(file.path) : file;
//         var params = {
//             Bucket: config.BUCKET_NAME,
//             Key: `${Date.now().toString()}${file.originalFilename || type}`,
//             Body: fileContent,
//             ContentType: file.type ?? 'pdf',
//             ACL: 'public-read'
//         };
//         s3bucket.upload(params, function (err, data) {
//             if (err) {
//                 console.log(err)
//             } else {
//                 resolve(data.Location)
//             }
//         });
//     })
// }
