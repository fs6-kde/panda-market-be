import { ProductComment } from "@prisma/client";
import productCommentRepository from "../repositories/productCommentRepository";

// 댓글 조회 시 사용하는 파라미터 타입
interface GetProductCommentsOptions {
  limit?: number;
  cursor?: number | null;
}

// 댓글 작성 시 반환 타입
interface CommentWithWriter extends ProductComment {
  writer: {
    id: number;
    nickName: string;
  };
}

// 상품 댓글 조회
async function getProductComments(
  productId: number,
  { limit = 5, cursor = null }: GetProductCommentsOptions
): Promise<{
  list: CommentWithWriter[];
  nextCursor: number | null;
}> {
  const comments = await productCommentRepository.findByProductId({
    productId,
    limit,
    cursor: cursor ?? undefined,
  });

  const nextCursor =
    comments.length === limit ? comments[comments.length - 1].id : null;

  return {
    list: comments,
    nextCursor,
  };
}

// 상품 댓글 등록
async function createProductComment(
  productId: number,
  userId: number,
  content: string
): Promise<CommentWithWriter> {
  return productCommentRepository.create({
    content,
    userId,
    productId,
  });
}

// 수정
async function updateProductComment(
  commentId: number,
  userId: number,
  content: string
) {
  return productCommentRepository.update({ commentId, userId, content });
}

// 삭제
async function deleteProductComment(commentId: number, userId: number) {
  return productCommentRepository.remove({ commentId, userId });
}

export default {
  getProductComments,
  createProductComment,
  updateProductComment,
  deleteProductComment,
};
