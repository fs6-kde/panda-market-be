import express, { NextFunction, Request, Response } from "express";
import auth from "../middlewares/auth";
import productService from "../services/productService";
import { Product } from "@prisma/client";
import { AuthenticationError, ValidationError } from "@/types/errors";
import multer from "multer";

const productController = express.Router();

// 상품 등록 api
productController.post(
  "/",
  auth.verifyAccessToken,
  async (
    req: Request<
      {},
      {},
      Pick<Product, "name" | "description" | "price"> & {
        tags?: string[] | string;
        images?: string[] | string;
      }
    > & { auth?: { userId: number } },
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.auth?.userId;
      // 인증 정보 유효성 검사
      if (!userId) throw new AuthenticationError("인증 정보가 없습니다.");

      // price 검사
      const price = Number(req.body.price);
      if (isNaN(price)) throw new ValidationError("가격은 숫자여야 합니다.");

      // tags 검사
      let tags: string[] = [];
      const rawTags = req.body.tags;

      if (Array.isArray(rawTags)) {
        tags = rawTags;
      } else if (typeof rawTags === "string") {
        try {
          tags = JSON.parse(rawTags);
        } catch (e) {
          throw new ValidationError("태그 형식 오류");
        }
      } else if (rawTags !== undefined) {
        throw new ValidationError("태그 형식 오류");
      }

      // images 검사
      let images: string[] = [];
      const rawImages = req.body.images;

      if (Array.isArray(rawImages)) {
        images = rawImages;
      } else if (typeof rawImages === "string") {
        try {
          images = JSON.parse(rawImages);
        } catch (e) {
          throw new ValidationError("이미지 형식 오류");
        }
      } else if (rawImages !== undefined) {
        throw new ValidationError("이미지 형식 오류");
      }

      const productData: Omit<
        Product,
        "id" | "createdAt" | "updatedAt" | "ownerId" | "favoriteCount"
      > = {
        name: req.body.name,
        description: req.body.description,
        price,
        tags,
        images,
      };

      const newProduct = await productService.createProduct(
        productData,
        userId
      );

      res.status(201).json(newProduct);
    } catch (err) {
      next(err);
    }
  }
);

// 상품 목록 조회 API
productController.get(
  "/",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;
      const orderBy = req.query.orderBy === "favorite" ? "favorite" : "recent";

      const { list, totalCount } = await productService.getAllProducts({
        page,
        pageSize,
        orderBy,
      });

      const formatted = list.map((p) => ({
        ...p,
        price: p.price.toLocaleString("ko-KR"),
      }));

      res.json({ list: formatted, totalCount });
    } catch (err) {
      next(err);
    }
  }
);

// 상품 상세 조회 api
productController.get(
  "/:id",
  async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.auth?.userId;

      const product = await productService.getProductById(
        Number(req.params.id),
        userId // 좋아요(isFavorite)에 의해 유저 id 전달
      );
      res.json(product);
    } catch (err) {
      next(err);
    }
  }
);

// 상품 삭제 API
productController.delete(
  "/:id",
  auth.verifyAccessToken,
  async (
    req: Request<{ id: string }> & { auth?: { userId: number } },
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.auth?.userId;
      if (!userId) throw new AuthenticationError("인증 정보가 없습니다.");

      const deleted = await productService.deleteProduct(Number(req.params.id));
      res.json(deleted);
    } catch (err) {
      next(err);
    }
  }
);

const upload = multer();

// 상품 수정 API
productController.patch(
  "/:id",
  auth.verifyAccessToken,
  upload.none(),
  async (
    req: Request<{ id: string }> & { auth?: { userId: number } },
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const id = Number(req.params.id);
      const userId = req.auth?.userId; // undefined 일 수 있으므로 '?'
      if (!userId) {
        throw new AuthenticationError("인증 정보가 없습니다.");
      }

      const body = req.body ?? {};

      const existing = body.existingImages ?? [];
      const existingImagePaths: string[] = Array.isArray(existing)
        ? existing
        : typeof existing === "string"
        ? [existing]
        : [];

      const newImages = body.newImagePaths ?? [];
      const newImagePaths: string[] = Array.isArray(newImages)
        ? newImages
        : typeof newImages === "string"
        ? [newImages]
        : [];

      // 태그 파싱
      let tags: string[] = [];
      try {
        tags =
          typeof body.tags === "string"
            ? JSON.parse(body.tags)
            : Array.isArray(body.tags)
            ? body.tags
            : [];
      } catch {
        throw new ValidationError("태그 형식이 올바르지 않습니다.");
      }

      const finalImagePaths = [...existingImagePaths, ...newImagePaths];

      // price 처리 (빈 문자열 또는 잘못된 값 방지)
      const parsedPrice = Number(body.price);
      const price = !isNaN(parsedPrice) ? parsedPrice : undefined;

      // 서비스에 넘길 데이터
      const updated = await productService.updateProduct(id, {
        name: body.name,
        description: body.description,
        price, // undefined일 경우 필터링됨
        tags,
        images: finalImagePaths, // 새 + 기존 이미지
        ownerId: userId,
      });

      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

export default productController;
