import express, { NextFunction, Request, Response } from "express";
import productCommentService from "../services/productCommentService";
import auth from "../middlewares/auth";
import { AuthenticationError, ValidationError } from "@/types/errors";

const productCommentController = express.Router();

interface AuthenticatedRequest extends Request {
  auth?: {
    userId: number;
  };
}

// 상품 댓글 조회
productCommentController.get(
  "/:id/comments",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const productId = Number(req.params.id);
      const limit = parseInt(req.query.limit as string) || 5;
      const cursor = req.query.cursor ? Number(req.query.cursor) : null;

      const result = await productCommentService.getProductComments(productId, {
        limit,
        cursor,
      });

      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

// 댓글 등록
productCommentController.post(
  "/:id/comments",
  auth.verifyAccessToken,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const productId = Number(req.params.id);
      const userId = req.auth?.userId;
      const { content } = req.body;

      if (!userId) {
        throw new AuthenticationError("인증 정보가 없습니다.");
      }

      if (!content || content.trim() === "") {
        throw new ValidationError("댓글 내용을 입력해주세요.");
      }

      const newComment = await productCommentService.createProductComment(
        productId,
        userId,
        content
      );

      res.status(201).json(newComment);
    } catch (err) {
      next(err);
    }
  }
);

// 댓글 수정
productCommentController.patch(
  "/comments/:commentId",
  auth.verifyAccessToken,
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const commentId = Number(req.params.commentId);
      const userId = req.auth?.userId;
      const { content } = req.body;

      if (!userId) throw new AuthenticationError("인증 정보가 없습니다.");
      if (!content || content.trim() === "")
        throw new ValidationError("댓글 내용을 입력해주세요.");

      const updated = await productCommentService.updateProductComment(
        commentId,
        userId,
        content
      );

      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

// 댓글 삭제
productCommentController.delete(
  "/comments/:commentId",
  auth.verifyAccessToken,
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const commentId = Number(req.params.commentId);
      const userId = req.auth?.userId;

      if (!userId) throw new AuthenticationError("인증 정보가 없습니다.");

      const result = await productCommentService.deleteProductComment(
        commentId,
        userId
      );

      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

export default productCommentController;
