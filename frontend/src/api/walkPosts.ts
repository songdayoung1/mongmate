import { apiFetch } from "./client";

export type WalkRecruitType = "WALK" | "DOG_CAFE";
export type WalkPostStatus = "OPEN" | "COMPLETED" | "EXPIRED";

export type WalkPostListItem = {
  postId: number;
  recruitType: WalkRecruitType;
  title: string;
  region: { regionId: number; displayName: string | null } | null;
  deadlineAt: string | null;
  authorNickname: string;
  status: WalkPostStatus;
  createdAt: string;
};

export type WalkPostListResponse = {
  page: {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    hasNext: boolean;
  };
  items: WalkPostListItem[];
};

export type WalkPostDetailResponse = {
  postId: number;
  recruitType?: WalkRecruitType;
  title: string;
  content?: string | null;
  region?: { regionId: number; displayName: string | null } | null;
  deadlineAt?: string | null;
  authorNickname?: string;
  status?: WalkPostStatus;
  createdAt?: string;
  meetAddress?: string | null;
  meetLocation?: any | null;
  chat?: { canChat: boolean; roomId: string | null } | null;
};

export type ListWalkPostsParams = {
  page?: number;
  size?: number;
};

export type WalkPostCreateRequest = {
  title: string;
  content: string;
  regionId: number;
  deadlineAt?: string | null; // ✅ "2026-02-13T18:00:00"
  meetAddress?: string | null;
  meetLat?: number | null;
  meetLng?: number | null;
};

export type WalkPostCreateResponse = { postId: number };

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
  });
}

/** GET /api/walk-posts/{postId} */
export async function getWalkPostDetail(postId: string | number) {
  return apiFetch<WalkPostDetailResponse>(`/api/walk-posts/${postId}`, {
    method: "GET",
    auth: "none",
  });
}

/** POST /api/walk-posts */
export async function createWalkPost(req: WalkPostCreateRequest) {
  return apiFetch<WalkPostCreateResponse>(`/api/walk-posts`, {
    method: "POST",
    auth: "required",
    body: JSON.stringify({
      title: req.title,
      content: req.content,
      regionId: req.regionId,
      deadlineAt: req.deadlineAt ?? null,
      meetAddress: req.meetAddress ?? null,
      meetLat: req.meetLat ?? null,
      meetLng: req.meetLng ?? null,
    }),
  });
}
