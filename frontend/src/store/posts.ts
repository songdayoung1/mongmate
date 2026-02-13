import { create } from "zustand";
import { listWalkPosts, type WalkPostListResponse } from "../api/walkPosts";

export type PostType = "WALK" | "DOG_CAFE";

export type HomePost = {
  id: string;
  type: PostType;
  title: string;
  region: string;
  deadlineText: string;
  authorNickname: string;
  content: string;
  placeName?: string;
  createdAt: string;
};

type PostStore = {
  posts: HomePost[];
  isLoading: boolean;
  error: string | null;

  addPost: (input: Omit<HomePost, "id" | "createdAt">) => void;
  loadPosts: (opts?: { page?: number; size?: number }) => Promise<void>;
};

function deadlineText(deadlineAt: string | null) {
  // 지금 너 백엔드 응답에 deadlineAt이 null일 수 있음
  if (!deadlineAt) return "마감일 미정";
  return deadlineAt; // 일단 그대로 보여주고, 나중에 포맷팅 원하면 바꾸면 됨
}

function mapItemToHomePost(
  item: WalkPostListResponse["items"][number],
): HomePost {
  return {
    id: String(item.postId),
    type: item.recruitType as PostType,
    title: item.title,
    region:
      item.region?.displayName ??
      (item.region?.regionId ? `지역 #${item.region.regionId}` : "지역 미정"),
    deadlineText: deadlineText(item.deadlineAt),
    authorNickname: item.authorNickname ?? "알 수 없음",
    content: "", // 목록 응답엔 content가 없어서 빈값
    createdAt: item.createdAt,
  };
}

export const usePostStore = create<PostStore>((set) => ({
  posts: [], // ✅ 초기엔 빈 배열 (서버에서 채움)
  isLoading: false,
  error: null,

  addPost: (input) =>
    set((state) => ({
      posts: [
        {
          ...input,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
        },
        ...state.posts,
      ],
    })),

  loadPosts: async (opts) => {
    const page = opts?.page ?? 0;
    const size = Math.min(Math.max(opts?.size ?? 10, 1), 50);

    set({ isLoading: true, error: null });
    try {
      const res = await listWalkPosts({
        page,
        size,
        // ✅ 너 백엔드 응답에서 recruitType="WALK" 글이 있으니 명시해도 되고 생략해도 됨
        // recruitType: "WALK",
        // status: "OPEN",
      });

      set({
        posts: res.items.map(mapItemToHomePost),
        isLoading: false,
      });
    } catch (e: any) {
      set({ isLoading: false, error: e?.message ?? "게시글 조회 실패" });
    }
  },
}));
