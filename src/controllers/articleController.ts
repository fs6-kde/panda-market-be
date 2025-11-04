import express, { NextFunction, Request, Response } from "express";
import auth from "../middlewares/auth";
import articleService from "../services/articleService";
import { AuthenticationError, ValidationError } from "@/types/errors";

const articleController = express.Router();

interface AuthenticatedRequest extends Request {
  auth?: { userId: number };
}

/** 게시글 등록 */
articleController.post(
  "/",
  auth.verifyAccessToken,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.auth?.userId;
      if (!userId) throw new AuthenticationError("인증 정보가 없습니다.");

      const { title, content } = req.body as {
        title?: string;
        content?: string;
      };

      const created = await articleService.createArticle({
        title: title ?? "",
        content: content ?? "",
        authorId: userId,
      });

      res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  }
);

/** 게시글 전체 조회 */
articleController.get(
  "/",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt((req.query.page as string) || "1", 10);
      const pageSize = parseInt((req.query.pageSize as string) || "10", 10);
      const orderBy =
        req.query.orderBy === "comment" ? "comment" : "recent"; /* 기본값 */

      const { list, totalCount } = await articleService.getAllArticles({
        page,
        pageSize,
        orderBy,
      });

      res.json({ list, totalCount });
    } catch (err) {
      next(err);
    }
  }
);

/** 게시글 상세 조회 */
articleController.get(
  "/:id",
  async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) throw new ValidationError("잘못된 게시글 ID입니다.");

      const article = await articleService.getArticleById(id);
      res.json(article);
    } catch (err) {
      next(err);
    }
  }
);

/** 게시글 수정 */
articleController.patch(
  "/:id",
  auth.verifyAccessToken,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const id = Number(req.params.id);
      const userId = req.auth?.userId;
      if (!userId) throw new AuthenticationError("인증 정보가 없습니다.");

      const { title, content } = req.body;
      const updated = await articleService.updateArticle(id, {
        title,
        content,
      });
      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

/** 게시글 삭제 */
articleController.delete(
  "/:id",
  auth.verifyAccessToken,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const id = Number(req.params.id);
      const userId = req.auth?.userId;
      if (!userId) throw new AuthenticationError("인증 정보가 없습니다.");

      const result = await articleService.deleteArticle(id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

export default articleController;
