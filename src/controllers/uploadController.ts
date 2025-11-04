// import s3 from "@/lib/s3Client";
// import upload from "@/middlewares/s3Uploader"; // S3용 multer 미들웨어
// import { ValidationError } from "@/types/errors";
// import { GetObjectAclCommand } from "@aws-sdk/client-s3";
// import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
// import express, { Request, Response } from "express";
// import multer, { StorageEngine } from "multer";
// import path from "path";

// const uploadController = express.Router();

// // 저장 방식
// const storage: StorageEngine = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, "uploads/");
//   },
//   filename: (req, file, cb) => {
//     const ext = path.extname(file.originalname);
//     cb(null, Date.now() + ext);
//   },
// });

// const upload = multer({ storage });

// // 단일 이미지 업로드 (image 필드 이름으로 전송)
// uploadController.post(
//   "/upload",
//   upload.single("image"),
//   (req: Request, res: Response) => {
//     if (!req.file) {
//       throw new ValidationError("이미지 파일이 없습니다.");
//     }

//     const imageUrl = `/uploads/${req.file.filename}`;
//     res.status(201).json({ url: imageUrl });
//   }
// );

// export default uploadController;

/**
 * 퍼블릭 폴더만
 */
// // 단일 이미지 업로드 (image 필드 이름으로 전송)
// uploadController.post(
//   "/upload",
//   upload.single("image"),
//   (req: Request, res: Response): void => {
//     // multer-s3는 `req.file.location`에 S3 URL을 담음
//     const file = req.file as any; // 타입 선언
//     console.log("S3 업로드 결과:", file);
//     if (!file || !file.location) {
//       throw new ValidationError("이미지 파일이 없습니다.");
//     }

//     res.status(201).json({ url: file.location }); // S3 URL 반환
//   }
// );

// export default uploadController;

/**
 * 미리 서명된 URL 포함
 */
// 단일 이미지 업로드 (image 필드 이름으로 전송)
// uploadController.post(
//   "/upload",
//   upload.single("images"),
//   async (req: Request, res: Response): Promise<void> => {
//     const file = req.file as any;

//     if (!file || !file.location || !file.key) {
//       throw new ValidationError("이미지 업로드에 실패했습니다.");
//     }

//     const isPrivate = req.query.access === "private";

//     let presignedUrl: string | null = null;
//     if (isPrivate) {
//       const command = new GetObjectAclCommand({
//         Bucket: process.env.AWS_BUCKET_NAME!,
//         Key: file.key,
//       });

//       presignedUrl = await getSignedUrl(s3, command, { expiresIn: 60 * 5 }); // 5분 (지나고 응답받은 presignedUrl을 클릭하면 에러 떠야함)
//     }

//     res.status(201).json({
//       url: file.location, // S3 전체 URL
//       key: file.key, // S3 key
//       presignedUrl, // 미리 서명된 URL (private일 경우에만)
//     });
//   }
// );

// export default uploadController;

import express, { Request, Response } from "express";
import upload from "@/middlewares/s3Uploader";
import { ValidationError } from "@/types/errors";

const uploadController = express.Router();

/**
 * 단일 이미지 업로드 (폼 필드명: "images")
 * presigned URL 없이, 즉시 접근 가능한 public URL 반환
 */
uploadController.post(
  "/upload",
  upload.single("images"),
  async (req: Request, res: Response) => {
    const file = req.file as any;

    if (!file || !file.location || !file.key) {
      throw new ValidationError("이미지 업로드에 실패했습니다.");
    }

    // multer-s3가 만드는 location 예시:
    // https://panda-market-img-bucket.s3.ap-southeast-2.amazonaws.com/panda-market/173..._img.png
    res.status(201).json({
      url: file.location, // ✅ 브라우저에서 바로 접근 가능한 절대 URL
      key: file.key, // ex) panda-market/173..._img.png (DB에는 key만 저장해도 됨)
    });
  }
);

export default uploadController;
