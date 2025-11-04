import express, { NextFunction, Request, Response } from "express";
import auth from "../middlewares/auth";
import articleCommentService from "../services/articleCommentService";
import { AuthenticationError } from "@/types/errors";

const articleCommentController = express.Router();

interface AuthenticatedRequest extends Request {
  auth?: { userId: number };
}

// 댓글 조회
articleCommentController.get(
  "/:id/comments",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const articleId = Number(req.params.id);
      const limit = parseInt(req.query.limit as string) || 5;
      const cursor = req.query.cursor ? Number(req.query.cursor) : null;

      const result = await articleCommentService.getArticleComments(articleId, {
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
articleCommentController.post(
  "/:id/comments",
  auth.verifyAccessToken,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.auth?.userId;
      if (!userId) throw new AuthenticationError("인증 정보가 없습니다.");

      const articleId = Number(req.params.id);
      const { content } = req.body as { content?: string };

      const created = await articleCommentService.createArticleComment(
        articleId,
        userId,
        content ?? ""
      );

      res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  }
);

// 댓글 수정
articleCommentController.patch(
  "/comments/:commentId",
  auth.verifyAccessToken,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.auth?.userId;
      if (!userId) throw new AuthenticationError("인증 정보가 없습니다.");

      const commentId = Number(req.params.commentId);
      const { content } = req.body as { content?: string };

      const updated = await articleCommentService.updateArticleComment(
        commentId,
        userId,
        content ?? ""
      );

      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

// 댓글 삭제
articleCommentController.delete(
  "/comments/:commentId",
  auth.verifyAccessToken,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.auth?.userId;
      if (!userId) throw new AuthenticationError("인증 정보가 없습니다.");

      const commentId = Number(req.params.commentId);

      const result = await articleCommentService.deleteArticleComment(
        commentId,
        userId
      );

      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

export default articleCommentController;
