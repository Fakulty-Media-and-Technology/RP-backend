// import cloudinary from "./cloudinary.js";

// const videoUploader = async (req, fileHandle, unique) => {
//     if (!req.files) return false;
//     if (!req.files[fileHandle]) return false;
//     let file = { ...req.files[fileHandle] };

//     const vidRes = new Promise(async (resolve, reject) => {
//         cloudinary.uploader.upload(
//             file.tempFilePath,
//             {
//                 folder: `NumismaticFiles/videos/${unique}`,
//                 resource_type: "video",
//                 quality: 90,
//                 eager: [
//                     {
//                         format: "mp4",
//                         transformation: [
//                             { width: 640, height: 480, crop: "pad" },
//                         ],
//                     },
//                 ],
//             },
//             (err, file) => {
//                 if (file) {
//                     resolve({
//                         secure_url: file.secure_url,
//                         public_id: file.public_id,
//                     });
//                 } else {
//                     reject({
//                         error: err.name,
//                         message: `Error occured while uploading image: ${err.message}`,
//                     });
//                 }
//             }
//         );
//     });

//     try {
//         const res = await vidRes;
//         // console.log(res);
//         return res;
//     } catch (error) {
//         console.log(error);
//         return error;
//     }
// };

// export default videoUploader;
