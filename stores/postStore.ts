import { create } from 'zustand';

export type Post = {
  id: string;
  placeName: string;
  rating: number;
  tags: string[];
  story: string;
  createdAt: string;
};

type PostState = {
  posts: Post[];
  addPost: (post: Post) => void;
};

export const usePostStore = create<PostState>()((set) => ({
  posts: [],
  addPost: (post) =>
    set((state) => ({
      posts: [post, ...state.posts],
    })),
}));
