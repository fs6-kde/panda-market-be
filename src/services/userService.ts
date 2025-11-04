import { User } from "@prisma/client";
import userRepository from "../repositories/userRepository";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {
  AuthenticationError,
  NotFoundError,
  ServerError,
  ValidationError,
} from "@/types/errors";

// 비번 암호화 함수
function hashPassword(password: NonNullable<User["password"]>) {
  return bcrypt.hash(password, 10);
}

// 비번 제외 필터 함수
function filterSensitiveUserData(
  user: User
): Omit<User, "password" | "refreshToken"> {
  const { password, refreshToken, ...rest } = user;
  return rest;
}

// 로그인 - 비번 일치 에러 함수
async function verifyPassword(
  inputPassword: NonNullable<User["password"]>,
  password: NonNullable<User["password"]>
) {
  const isMatch = await bcrypt.compare(inputPassword, password);
  if (!isMatch) {
    throw new AuthenticationError("비밀번호가 일치하지 않습니다.");
  }
}

/**
 * 계정 만들기 - 이메일 중복 여부, 비번 해싱 과정
 */
async function createdUser(
  user: Pick<User, "email" | "nickName" | "password">
) {
  try {
    // 이메일을 통한 유저 존재여부
    const existedUser = await userRepository.findByEmail(user.email);
    if (existedUser) {
      throw new ValidationError("User already exists", { email: user.email });
    }

    const hashedPassword = await hashPassword(user.password);
    const createdUser = await userRepository.save({
      ...user,
      password: hashedPassword,
    });
    return filterSensitiveUserData(createdUser);
  } catch (error) {
    if (error instanceof ValidationError) throw error;
    throw new ServerError("회원가입 중 오류가 발생했습니다");
  }
}

/**
 * 로그인 - 이메일 존재 여부, 비번 일치 검사
 */
async function getUser(
  email: User["email"],
  password: NonNullable<User["password"]>
) {
  try {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new AuthenticationError("존재하지 않는 이메일입니다.");
    }
    await verifyPassword(password, user.password);
    return filterSensitiveUserData(user);
  } catch (error) {
    if (error instanceof AuthenticationError) throw error;
    throw new ServerError("로그인 중 오류가 발생했습니다");
  }
}

// 토큰 생성 함수
function createToken(
  user: Omit<User, "password" | "refreshToken">,
  type: "access" | "refresh" = "access"
) {
  const payload = { userId: user.id };
  const secret = process.env.JWT_SECRET;
  if (!secret)
    throw new ServerError("JWT_SECRET 환경변수가 설정되지 않았습니다");
  const expiresIn = type === "refresh" ? "1h" : "15m";
  return jwt.sign(payload, secret, { expiresIn });
}

// 로큰 재발급 함수
async function refreshToken(
  userId: User["id"],
  refreshToken: NonNullable<User["refreshToken"]>
) {
  const user = await userRepository.findById(userId);
  if (!user || user.refreshToken !== refreshToken) {
    throw new AuthenticationError("Unauthorized");
  }

  const newAccessToken = createToken(user);
  const newRefreshToken = createToken(user, "refresh");

  // 새 리프레쉬 토큰 DB에 저장
  await userRepository.update(userId, { refreshToken: newRefreshToken });

  return { newAccessToken, newRefreshToken };
}

// 유저 정보 갱신
async function updateUser(
  id: User["id"],
  data: Partial<Omit<User, "id" | "createdAt" | "updatedAt">>
) {
  const updatedUser = await userRepository.update(id, data);
  return filterSensitiveUserData(updatedUser);
}

// 사용자 찾기 (실습자료 참고해서 넣음)
async function getUserById(id: User["id"]) {
  const user = await userRepository.findById(id);
  if (!user) throw new NotFoundError("사용자를 찾을 수 없습니다");
  return filterSensitiveUserData(user);
}

/** 현재 사용자 세션(리프레시 토큰) 무효화 */
async function logout(userId: number) {
  try {
    // DB에 저장된 refreshToken 제거
    await userRepository.update(userId, { refreshToken: null });
  } catch (e) {
    throw new ServerError("로그아웃 중 오류가 발생했습니다.");
  }
}

export default {
  createdUser,
  getUser,
  createToken,
  refreshToken,
  updateUser,
  getUserById,
  logout,
};
