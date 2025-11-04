import prisma from "../config/prisma";
import type { ArticleComment } from "@prisma/client";

interface FindByArticleIdParams {
  articleId: number;
  limit: number;
  cursor?: number;
}

interface CreateParams {
  content: string;
  userId: number;
  articleId: number;
}

// 게시글 댓글 조회 (+ 최신순, 커서, 제한)
async function findByArticleId({
  articleId,
  limit,
  cursor,
}: FindByArticleIdParams): Promise<
  (ArticleComment & {
    writer: { id: number; nickName: string };
  })[]
> {
  return prisma.articleComment.findMany({
    where: { articleId },
    take: limit,
    skip: cursor ? 1 : 0,
    cursor: cursor ? { id: cursor } : undefined,
    orderBy: { id: "desc" },
    include: {
      writer: {
        select: { id: true, nickName: true },
      },
    },
  });
}

// 게시글 댓글 등록
async function create({
  content,
  userId,
  articleId,
}: CreateParams): Promise<
  ArticleComment & { writer: { id: number; nickName: string } }
> {
  return prisma.articleComment.create({
    data: { content, userId, articleId },
    include: {
      writer: { select: { id: true, nickName: true } },
    },
  });
}

// 게시글 댓글 단건 조회
async function findById(id: number): Promise<ArticleComment | null> {
  return prisma.articleComment.findUnique({ where: { id } });
}

// 게시글 댓글 수정
async function update(id: number, content: string): Promise<ArticleComment> {
  return prisma.articleComment.update({
    where: { id },
    data: { content },
  });
}

// 게시글 댓글 삭제
async function remove(id: number): Promise<ArticleComment> {
  return prisma.articleComment.delete({ where: { id } });
}

export default { findByArticleId, create, findById, update, remove };
