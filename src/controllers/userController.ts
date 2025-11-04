import express, { NextFunction, Request, Response } from "express";
import userService from "../services/userService";
import auth from "../middlewares/auth";
import userRepository from "../repositories/userRepository";
import { User } from "@prisma/client";
import { ValidationError } from "@/types/errors";

// express 라우터 적용
const userController = express.Router();

/**
 * 회원가입
 */
userController.post(
  "/users",
  async (
    req: Request<{}, {}, Pick<User, "email" | "nickName" | "password">>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { email, nickName, password } = req.body;
      if (!email || !nickName || !password) {
        throw new ValidationError("필수 입력사항입니다.");
      }
      const user = await userService.createdUser({ email, nickName, password });
      res.status(201).json(user);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * 로그인
 */
userController.post(
  "/login",
  async (
    req: Request<{}, {}, Pick<User, "email" | "password">>,
    res: Response,
    next: NextFunction
  ) => {
    const { email, password } = req.body;
    try {
      if (!email || !password) {
        throw new ValidationError("email, password 가 모두 필요합니다.");
      }
      const user = await userService.getUser(email, password);

      // JWT 발급
      const accessToken = userService.createToken(user);
      const refreshToken = userService.createToken(user, "refresh");

      // refreshToken DB 저장
      await userService.updateUser(user.id, { refreshToken });

      // // accessToken도 쿠키에 저장
      // res.cookie("accessToken", accessToken, {
      //   httpOnly: true,
      //   secure: true,
      //   sameSite: "none",
      //   path: "/", // 모든 요청에서 자동으로 포함되도록 설정
      //   maxAge: 1000 * 60 * 15, // 15분 정도로 설정
      // });

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        sameSite: "none",
        secure: true,
        path: "/token/refresh",
        maxAge: 1000 * 60 * 60, // 2주
      });

      res.json({
        id: user.id,
        email: user.email,
        nickName: user.nickName,
        accessToken,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * refreshToken 재발급
 */
userController.post(
  "/token/refresh",
  auth.verifyRefreshToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refreshToken = req.cookies.refreshToken;
      const { userId } = (req as any).auth;
      const { newAccessToken, newRefreshToken } =
        await userService.refreshToken(userId, refreshToken);
      res.cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        sameSite: "none",
        secure: true,
        path: "/token/refresh",
        maxAge: 1000 * 60 * 60,
      });

      res.json({ accessToken: newAccessToken });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * 유저 로그인 확인
 */
userController.get(
  "/users/me",
  auth.verifyAccessToken,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.auth?.userId;
      // const userId = req.auth; // userId가 number가 아니라 { userId: number }, 객체 전체
      if (!userId) {
        res.status(401).json({ message: "인증 정보가 없습니다." });
        return;
      }

      const user = await userRepository.findById(userId);
      if (!user) {
        res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
        return;
      }

      const { password, refreshToken, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * 로그아웃
 * - 요구사항: DB refreshToken 제거 + 브라우저 쿠키 삭제
 * - 인증: Access Token 필요 (현재 기기에서만 로그아웃)
 */
userController.post(
  "/logout",
  auth.verifyAccessToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.auth?.userId;
      if (!userId) {
        return res.status(401).json({ message: "인증 정보가 없습니다." });
      }

      // 1) DB에서 refreshToken 제거
      await userService.logout(userId);

      // 2) 브라우저 쿠키 삭제 (발급 시와 동일한 옵션으로 clear)
      //   - path, sameSite, secure, httpOnly가 발급과 동일해야 함
      res.clearCookie("refreshToken", {
        httpOnly: true,
        sameSite: "none",
        secure: true,
        path: "/token/refresh",
      });

      // (선택) accessToken은 클라이언트 저장소(localStorage/메모리)에서 제거
      // 서버에서는 관리하지 않으므로 안내 메시지만 반환
      return res.json({ message: "로그아웃 되었습니다." });
    } catch (error) {
      next(error);
    }
  }
);

export default userController;
