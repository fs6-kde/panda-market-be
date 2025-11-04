import prisma from "../config/prisma";
import type { Prisma, Article } from "@prisma/client";

// ==================================================================
type Order = { [key: string]: "asc" | "desc" };

interface CreateParams extends Pick<Article, "title" | "content"> {
  authorId: number;
}
interface FindAllParams {
  skip: number;
  take: number;
  orderBy: Order;
}

// include 스펙을 타입으로 안전하게 정의
export type ArticleListItem = Prisma.ArticleGetPayload<{
  include: {
    author: { select: { id: true; nickName: true } };
    _count: { select: { comments: true } };
  };
}>;

export type ArticleCreated = ArticleListItem;
// ===================================================================

// 게시글 등록
async function create({
  title,
  content,
  authorId,
}: CreateParams): Promise<ArticleCreated> {
  return prisma.article.create({
    data: { title, content, authorId },
    include: {
      author: { select: { id: true, nickName: true } },
      _count: { select: { comments: true } },
    },
  });
}

// 게시글 목록 조회
async function findAll({
  skip,
  take,
  orderBy,
}: FindAllParams): Promise<ArticleListItem[]> {
  return prisma.article.findMany({
    skip,
    take,
    orderBy,
    include: {
      author: { select: { id: true, nickName: true } },
      _count: { select: { comments: true } },
    },
  });
}

// 전체 게시글 수
async function count(): Promise<number> {
  return prisma.article.count();
}

// 게시글 상세 조회
async function findById(id: number): Promise<ArticleListItem | null> {
  return prisma.article.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, nickName: true } },
      _count: { select: { comments: true } },
    },
  });
}

// 게시글 수정
async function update(
  id: number,
  data: Partial<Pick<Article, "title" | "content">>
): Promise<ArticleListItem> {
  return prisma.article.update({
    where: { id },
    data,
    include: {
      author: { select: { id: true, nickName: true } },
      _count: { select: { comments: true } },
    },
  });
}

// 게시글 삭제
async function remove(id: number): Promise<Article> {
  return prisma.article.delete({
    where: { id },
  });
}

export default { create, findAll, count, findById, update, remove };
