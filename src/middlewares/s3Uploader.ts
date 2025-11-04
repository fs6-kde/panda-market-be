import multer from "multer";
import { configDotenv } from "dotenv";
import s3 from "@/lib/s3Client";
import { Request } from "express";
const multerS3 = require("multer-s3");

configDotenv();

// 파일명 정규화 helper
const normalize = (name: string) =>
  name
    .replace(/\.[^/.]+$/, "") // 확장자 제거
    .replace(/[^\w\-]+/g, "_"); // 공백/한글/특수문자 -> _

const upload = multer({
  storage: multerS3({
    s3,
    bucket: process.env.AWS_BUCKET_NAME!,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    // acl: "public-read", // 업로드 즉시 공개 -> 연결된 버킷이 ACL 금지 상태이므로 사용x
    // 캐시 전략(권장): 썸네일 등 자주 바뀌지 않으면 길게 캐시
    cacheControl: "public, max-age=31536000, s-maxage=31536000",
    key: (
      req: Request,
      file: Express.Multer.File,
      cb: (err: Error | null, key?: string) => void
    ) => {
      const dot = file.originalname.lastIndexOf(".");
      const ext = dot >= 0 ? file.originalname.slice(dot).toLowerCase() : "";
      const base = normalize(file.originalname);
      const folder = "panda-market";
      const unique = `${Date.now()}_${base}${ext}`;
      cb(null, `${folder}/${unique}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
});

export default upload;
