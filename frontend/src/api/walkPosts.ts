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

export type MyWalkPostStatus = "ACTIVE" | "CLOSED";

export type MyWalkPostListItem = {
  postId: number;
  status: MyWalkPostStatus | string;
  title: string;
  regionText: string | null;
  deadlineText: string | null;
  createdAt: string;
};

export type MyWalkPostListResponse = {
  items: MyWalkPostListItem[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
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
  regionId?: number;
  status?: WalkPostStatus;
  recruitType?: WalkRecruitType;
};

export type WalkPostCreateRequest = {
  title: string;
  content: string;
  regionId: number;
  deadlineAt?: string | null; // ??"2026-02-13T18:00:00"
  meetAddress?: string | null;
  meetLat?: number | null;
  meetLng?: number | null;
};

export type WalkPostCreateResponse = { postId: number };
export type WalkPostUpdateRequest = {
  title: string;
  content: string;
  deadlineAt?: string | null;
  meetAddress?: string | null;
  meetLat?: number | null;
  meetLng?: number | null;
};

export type ListMyWalkPostsParams = {
  page?: number;
  size?: number;
  status?: MyWalkPostStatus;
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
  });
}

/** GET /api/walk-posts/{postId} */
export async function getWalkPostDetail(postId: string | number) {
  return apiFetch<WalkPostDetailResponse>(`/api/walk-posts/${postId}`, {
    method: "GET",
    auth: "auto",
  });
}

/** GET /api/walk-posts/{postId} (auth required) */
export async function getWalkPostDetailAuthed(postId: string | number) {
  return apiFetch<WalkPostDetailResponse>(`/api/walk-posts/${postId}`, {
    method: "GET",
    auth: "required",
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

/** GET /api/walk-posts/my */
export async function listMyWalkPosts(params: ListMyWalkPostsParams = {}) {
  return apiFetch<MyWalkPostListResponse>(
    `/api/walk-posts/my${toQuery(params)}`,
    {
      method: "GET",
      auth: "required",
    },
  );
}

/** PUT /api/walk-posts/{postId} */
export async function updateWalkPost(
  postId: string | number,
  req: WalkPostUpdateRequest,
) {
  return apiFetch<WalkPostDetailResponse>(`/api/walk-posts/${postId}`, {
    method: "PUT",
    auth: "required",
    body: JSON.stringify({
      title: req.title,
      content: req.content,
      deadlineAt: req.deadlineAt ?? null,
      meetAddress: req.meetAddress ?? null,
      meetLat: req.meetLat ?? null,
      meetLng: req.meetLng ?? null,
    }),
  });
}

