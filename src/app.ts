import express, { NextFunction, Request, Response } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
// import path from "path";
import { UnauthorizedError } from "express-jwt";

// 컨트롤러 연결
import userController from "./controllers/userController";
import productController from "./controllers/productController";
import productCommentController from "./controllers/productCommentController";
import favoriteController from "./controllers/favoriteController";
import uploadController from "./controllers/uploadController";
import { AppError } from "./types/errors";
import articleController from "./controllers/articleController";
import articleCommentController from "./controllers/articleCommentController";

const app = express();
const port = process.env.PORT ?? 3000;

// app 설정
app.use(cookieParser());
app.use(express.json());

// 프론트에서 요청이 동작하기 위해 cors 적용
app.use(
  cors({
    origin: "http://localhost:3001",
    credentials: true,
  })
);

// 업로드 이미지 정적 경로 (S3 연결하여 필요 x)
// app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// 컨트롤러 연결
app.use("/api", uploadController);
app.use("/", userController);
app.use("/products", productController);
app.use("/product", productCommentController);
app.use("/", favoriteController);
app.use("/articles", articleController);
app.use("/article", articleCommentController);

// express-jwt 인증 에러 핸들링
app.use((err: any, req: Request, res: Response, next: NextFunction): void => {
  if (err instanceof UnauthorizedError) {
    console.error("JWT 인증 오류:", err.message);
    res.status(401).json({ message: "인증이 유효하지 않습니다." });
    return;
  }
  next(err);
});

// AppError 핸들링
app.use((err: any, req: Request, res: Response, next: NextFunction): void => {
  if (err instanceof AppError) {
    console.error(`[AppError] ${err.name}:`, err.message);
    res.status(err.code || 500).json({ message: err.message, data: err.data });
    return;
  }
  console.error("[Unknown Error]", err);
  res.status(500).json({ message: "서버 내부 오류가 발생했습니다." });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
