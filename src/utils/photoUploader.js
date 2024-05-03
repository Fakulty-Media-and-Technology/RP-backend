// import cloudinary from "./cloudinary.js";

// const photoUploader = async (req, fileHandle, unique) => {
//     if (!req.files) return false;
//     if (!req.files[fileHandle]) return false;

//     let files = Array.isArray(req.files[fileHandle])
//         ? req.files[fileHandle]
//         : [req.files[fileHandle]];

//     if (files?.length > 7) {
//         return {
//             status: 400,
//             message: "you cannot add more than 7 photos",
//         };
//     }

//     let cloudRes = [];

//     for (let file of files) {
//         const pixRes = new Promise(async (resolve, reject) => {
//             cloudinary.uploader.upload(
//                 file.tempFilePath,
//                 {
//                     folder: `NumismaticFiles/photos/${unique}`,
//                     resource_type: "image",
//                     transformation: [
//                         {
//                             quality: 80,
//                             format: "png",
//                         },
//                     ],
//                 },
//                 (err, file) => {
//                     if (file) {
//                         resolve({
//                             secure_url: file.secure_url,
//                             public_id: file.public_id,
//                         });
//                     } else {
//                         reject({
//                             error: err.name,
//                             message: `Error occured while uploading image: ${err.message}`,
//                         });
//                     }
//                 }
//             );
//         });
//         const res = await pixRes;
//         cloudRes.push(res);
//     }

//     try {
//         return cloudRes;
//     } catch (error) {
//         console.log(error);
//         return error;
//     }
// };

// export default photoUploader;
