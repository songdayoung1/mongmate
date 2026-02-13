import { apiFetch } from "./client";

export type WalkRecruitType = "WALK" | "DOG_CAFE";
export type WalkPostStatus = "OPEN" | "COMPLETED" | "EXPIRED";

export type WalkPostListResponse = {
  page: {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    hasNext: boolean;
  };
  items: Array<{
    postId: number;
    recruitType: WalkRecruitType;
    title: string;
    region: { regionId: number; displayName: string | null } | null;
    deadlineAt: string | null;
    authorNickname: string;
    status: WalkPostStatus;
    createdAt: string;
  }>;
};

export type ListWalkPostsParams = {
  page?: number;
  size?: number;
  regionId?: number;
  status?: WalkPostStatus;
  recruitType?: WalkRecruitType;
};

function toQuery(params: Record<string, any>) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    q.set(k, String(v));
  });
  const s = q.toString();
  return s ? `?${s}` : "";
}

/** GET /api/walk-posts */
export async function listWalkPosts(params: ListWalkPostsParams = {}) {
  return apiFetch<WalkPostListResponse>(`/api/walk-posts${toQuery(params)}`, {
    method: "GET",
    auth: "none",
    // debug: true, // ✅ 필요하면 켜서 콘솔에서 실제 요청 확인
  });
}
