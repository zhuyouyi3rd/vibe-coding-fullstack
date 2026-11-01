export interface AuthUser {
  id: number;
  username: string;
  email: string;
  avatar: string;
  createdAt: string;
}

export interface Author {
  id: number;
  username: string;
  avatar: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  postCount?: number;
}

export interface PostSummary {
  id: number;
  title: string;
  excerpt: string;
  cover: string;
  tags: string[];
  views: number;
  createdAt: string;
  updatedAt: string;
  category: Category;
  author: Author;
}

export interface PostDetail extends Omit<PostSummary, 'excerpt'> {
  content: string;
}

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PostListResponse {
  data: PostSummary[];
  pagination: Pagination;
}

export interface PublicProfile {
  id: number;
  username: string;
  avatar: string;
  createdAt: string;
  stats: {
    postCount: number;
    viewCount: number;
  };
  recentPosts: PostSummary[];
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}
