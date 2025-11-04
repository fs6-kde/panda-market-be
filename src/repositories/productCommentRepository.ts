import { ProductComment } from "@prisma/client";
import prisma from "../config/prisma";

interface FindByProductIdParams {
  productId: number;
  limit: number;
  cursor?: number;
}

interface CreateCommentParams {
  content: string;
  userId: number;
  productId: number;
}

interface UpdateCommentParams {
  commentId: number;
  userId: number;
  content: string;
}

interface DeleteCommentParams {
  commentId: number;
  userId: number;
}

// 상품 댓글 조회 (+ 최신순, 커서, 제한)
async function findByProductId({
  productId,
  limit,
  cursor,
}: FindByProductIdParams): Promise<
  (ProductComment & {
    writer: { id: number; nickName: string };
  })[]
> {
  return prisma.productComment.findMany({
    where: { productId },
    take: limit,
    skip: cursor ? 1 : 0,
    cursor: cursor ? { id: cursor } : undefined,
    orderBy: { id: "desc" },
    include: {
      writer: {
        select: {
          id: true,
          nickName: true,
        },
      },
    },
  });
}

// 상품 댓글 등록
async function create({
  content,
  userId,
  productId,
}: CreateCommentParams): Promise<
  ProductComment & {
    writer: { id: number; nickName: string };
  }
> {
  return prisma.productComment.create({
    data: {
      content,
      userId,
      productId,
    },
    include: {
      writer: {
        select: {
          id: true,
          nickName: true,
        },
      },
    },
  });
}

// 상품 댓글 수정
async function update({ commentId, userId, content }: UpdateCommentParams) {
  const comment = await prisma.productComment.findUnique({
    where: { id: commentId },
  });

  if (!comment) throw new Error("댓글을 찾을 수 없습니다.");
  if (comment.userId !== userId)
    throw new Error("본인 댓글만 수정할 수 있습니다.");

  return prisma.productComment.update({
    where: { id: commentId },
    data: { content },
    include: { writer: { select: { id: true, nickName: true } } },
  });
}

// 상품 댓글 삭제
async function remove({ commentId, userId }: DeleteCommentParams) {
  const comment = await prisma.productComment.findUnique({
    where: { id: commentId },
  });

  if (!comment) throw new Error("댓글을 찾을 수 없습니다.");
  if (comment.userId !== userId)
    throw new Error("본인 댓글만 삭제할 수 있습니다.");

  await prisma.productComment.delete({ where: { id: commentId } });

  return { id: commentId, message: "성공적으로 삭제되었습니다." };
}

export default {
  findByProductId,
  create,
  update,
  remove,
};

// 아래의 타입 생략을 수정과 삭제 로직엔 해도 되는 이유
// Promise<
//   ProductComment & {
//     writer: { id: number; nickName: string };
//   }
// >
// Prisma의 update()와 delete()는 반환값 타입이 자동으로 ProductComment 혹은 void로 추론됩니다.
