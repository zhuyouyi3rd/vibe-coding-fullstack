export interface AuthUser {
  id: number;
  username: string;
  email: string;
  avatar: string;
  points: number;
  createdAt: string;
}

export interface Author {
  id: number;
  username: string;
  avatar: string;
  points: number;
}

export interface QuestionSummary {
  id: number;
  title: string;
  excerpt: string;
  tags: string[];
  views: number;
  answersCount: number;
  votes: number;
  isSolved: boolean;
  likedByMe: boolean;
  createdAt: string;
  updatedAt: string;
  author: Author;
}

export interface Answer {
  id: number;
  content: string;
  votes: number;
  isAccepted: boolean;
  likedByMe: boolean;
  createdAt: string;
  updatedAt: string;
  author: Author;
}

export interface QuestionDetail extends Omit<QuestionSummary, 'excerpt'> {
  content: string;
  answers: Answer[];
}

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface QuestionListResponse {
  data: QuestionSummary[];
  pagination: Pagination;
}

export interface Tag {
  name: string;
  count: number;
}

export interface Leader {
  id: number;
  username: string;
  avatar: string;
  points: number;
  questionCount: number;
  answerCount: number;
}

export interface SiteStats {
  questions: number;
  answers: number;
  users: number;
  solved: number;
  solveRate: number;
}

export interface Profile {
  user: {
    id: number;
    username: string;
    avatar: string;
    points: number;
    createdAt: string;
  };
  stats: {
    questionCount: number;
    answerCount: number;
    acceptedCount: number;
    receivedVotes: number;
  };
  questions: QuestionSummary[];
  answers: Array<{
    id: number;
    content: string;
    votes: number;
    isAccepted: boolean;
    createdAt: string;
    questionId: number;
    questionTitle: string;
  }>;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}
