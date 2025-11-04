import type { Article } from "@prisma/client";
import articleRepository, {
  ArticleCreated,
  ArticleListItem,
} from "../repositories/articleRepository";
import { NotFoundError, ValidationError } from "@/types/errors";

interface CreateArticleDTO extends Pick<Article, "title" | "content"> {
  authorId: number;
}

interface GetArticlesQuery {
  page?: number;
  pageSize?: number;
  orderBy?: "recent" | "comment";
}

// 게시글 등록
async function createArticle({
  title,
  content,
  authorId,
}: CreateArticleDTO): Promise<ArticleCreated> {
  if (!title?.trim()) throw new ValidationError("제목을 입력해주세요.");
  if (!content?.trim()) throw new ValidationError("내용을 입력해주세요.");

  return articleRepository.create({
    title: title.trim(),
    content: content.trim(),
    authorId,
  });
}

// 게시글 목록 조회
async function getAllArticles({
  page = 1,
  pageSize = 10,
  orderBy = "recent",
}: GetArticlesQuery): Promise<{ list: ArticleListItem[]; totalCount: number }> {
  const skip = (page - 1) * pageSize;
  const take = pageSize;

  const order =
    orderBy === "comment"
      ? ({ comments: { _count: "desc" } } as const)
      : ({ createdAt: "desc" } as const);

  const [list, totalCount] = await Promise.all([
    articleRepository.findAll({ skip, take, orderBy: order as any }),
    articleRepository.count(),
  ]);

  return { list, totalCount };
}

// 게시글 상세 조회
async function getArticleById(id: number): Promise<ArticleListItem> {
  if (!id) throw new ValidationError("게시글 ID가 필요합니다.");
  const article = await articleRepository.findById(id);
  if (!article) throw new NotFoundError("게시글을 찾을 수 없습니다.");
  return article;
}

// 게시글 수정
async function updateArticle(
  id: number,
  data: Partial<Pick<Article, "title" | "content">>
): Promise<ArticleListItem> {
  const existing = await articleRepository.findById(id);
  if (!existing) throw new NotFoundError("수정할 게시글이 없습니다.");

  return articleRepository.update(id, data);
}

// 게시글 삭제
async function deleteArticle(
  id: number
): Promise<{ id: number; message: string }> {
  const existing = await articleRepository.findById(id);
  if (!existing) throw new NotFoundError("삭제할 게시글이 없습니다.");

  await articleRepository.remove(id);
  return { id, message: "성공적으로 삭제되었습니다." };
}

export default {
  createArticle,
  getAllArticles,
  getArticleById,
  updateArticle,
  deleteArticle,
};
