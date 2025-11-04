import articleCommentRepository from "../repositories/articleCommentRepository";
import { AppError, ValidationError } from "@/types/errors";

interface GetCommentsOptions {
  limit?: number;
  cursor?: number | null;
}

// 댓글 조회
async function getArticleComments(
  articleId: number,
  { limit = 5, cursor = null }: GetCommentsOptions
) {
  const comments = await articleCommentRepository.findByArticleId({
    articleId,
    limit,
    cursor: cursor ?? undefined,
  });

  const nextCursor =
    comments.length === limit ? comments[comments.length - 1].id : null;

  return { list: comments, nextCursor };
}

// 댓글 등록
async function createArticleComment(
  articleId: number,
  userId: number,
  content: string
) {
  if (!content || !content.trim()) {
    throw new ValidationError("댓글 내용을 입력해주세요.");
  }

  return articleCommentRepository.create({
    content: content.trim(),
    userId,
    articleId,
  });
}

// 댓글 수정 (본인만)
async function updateArticleComment(
  commentId: number,
  userId: number,
  content: string
) {
  const found = await articleCommentRepository.findById(commentId);
  if (!found) throw new AppError("댓글을 찾을 수 없습니다.", 404);
  if (found.userId !== userId)
    throw new AppError("댓글 수정 권한이 없습니다.", 403);
  if (!content.trim()) throw new ValidationError("댓글 내용을 입력해주세요.");

  return articleCommentRepository.update(commentId, content.trim());
}

// 댓글 삭제 (본인만)
async function deleteArticleComment(commentId: number, userId: number) {
  const found = await articleCommentRepository.findById(commentId);
  if (!found) throw new AppError("댓글을 찾을 수 없습니다.", 404);
  if (found.userId !== userId)
    throw new AppError("댓글 삭제 권한이 없습니다.", 403);

  const deleted = await articleCommentRepository.remove(commentId);
  return { id: deleted.id, message: "성공적으로 삭제되었습니다." };
}

export default {
  getArticleComments,
  createArticleComment,
  updateArticleComment,
  deleteArticleComment,
};
