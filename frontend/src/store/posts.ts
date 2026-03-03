import { create } from "zustand";
import {
  listWalkPosts,
  type WalkPostStatus,
  type WalkRecruitType,
} from "../api/walkPosts";

export type PostType = "WALK" | "DOG_CAFE";
const DOG_CAFE_PREFIX = "[DOG_CAFE] ";

export type HomePost = {
  id: string;
  type: PostType;
  title: string;
  region: string;
  deadlineText: string;
  deadlineAt: string | null;
  authorNickname: string;
  content: string;
  placeName?: string;
  createdAt: string;
  status: WalkPostStatus;
};

type PostStore = {
  posts: HomePost[];
  isLoading: boolean;
  error: string | null;
  loadPosts: (opts?: { page?: number; size?: number }) => Promise<void>;
};

function inferTypeAndTitle(
  serverType: WalkRecruitType,
  title: string,
): { type: PostType; title: string } {
  if (title.startsWith(DOG_CAFE_PREFIX)) {
    return { type: "DOG_CAFE", title: title.replace(DOG_CAFE_PREFIX, "") };
  }
  return { type: serverType === "DOG_CAFE" ? "DOG_CAFE" : "WALK", title };
}

function formatDeadlineText(deadlineAt: string | null) {
  if (!deadlineAt) return "마감일 미정";
  return deadlineAt;
}

export const usePostStore = create<PostStore>((set) => ({
  posts: [],
  isLoading: false,
  error: null,

  loadPosts: async (opts) => {
    const page = opts?.page ?? 0;
    const size = Math.min(Math.max(opts?.size ?? 10, 1), 50);

    set({ isLoading: true, error: null });
    try {
      const res = await listWalkPosts({ page, size });

      const mapped: HomePost[] = res.items.map((it) => {
        const fixed = inferTypeAndTitle(it.recruitType, it.title);
        return {
          id: String(it.postId),
          type: fixed.type,
          title: fixed.title,
          region:
            it.region?.displayName ??
            (it.region?.regionId ? `지역 #${it.region.regionId}` : "지역 정보 없음"),
          deadlineText: formatDeadlineText(it.deadlineAt ?? null),
          deadlineAt: it.deadlineAt ?? null,
          authorNickname: it.authorNickname ?? "익명",
          content: "",
          createdAt: it.createdAt,
          status: it.status,
        };
      });

      mapped.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

      set({ posts: mapped, isLoading: false });
    } catch (e: any) {
      set({ isLoading: false, error: e?.message ?? "모집글 목록을 불러오지 못했습니다." });
    }
  },
}));
