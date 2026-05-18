import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

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
  clearPosts: () => void;
};

export const usePostStore = create<PostState>()(
  persist(
    (set) => ({
      posts: [],
      addPost: (post) =>
        set((state) => ({
          posts: [post, ...state.posts],
        })),
      clearPosts: () => set({ posts: [] }),
    }),
    {
      name: 'vesper-posts',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ posts: state.posts }),
    },
  ),
);
