import { apiFetch } from "./client";
import { useAuthStore } from "../store/auth";

export type GuardianProfileDTO = {
  userId: number;
  nickname: string;
  genderCode: string | null;
  bio: string | null;
  avatarUrl: string | null;
  heartsCount: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
};

export type DogProfileDTO = {
  id: number;
  guardianUserId: number;
  name: string;
  breed: string | null;
  ageYears: number | null;
  genderCode: string | null;
  isNeutered: boolean | null;
  vaccinationNote: string | null;
  dispositionText: string | null;
  photoUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type UserNeighborhoodDTO = {
  id: number;
  userId: number;
  regionId: number;
  radiusMeters: number | null;
  active: boolean;
  createdAt: string;
};

export type ProfileResponse = {
  user: {
    id: number;
    phoneNumber: string;
    createdAt: string;
  };
  guardianProfile: GuardianProfileDTO | null;
  neighborhood: UserNeighborhoodDTO | null;
  dogs: DogProfileDTO[];
  profileExists: boolean;
};

export type UpsertProfileRequest = {
  nickname: string;
  genderCode?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
};

export type UpsertDogProfileRequest = {
  name: string;
  breed?: string | null;
  ageYears?: number | null;
  genderCode?: string | null;
  isNeutered?: boolean | null;
  vaccinationNote?: string | null;
  dispositionText?: string | null;
  photoUrl?: string | null;
};

type BackendProfileResponse = {
  userId: number;
  nickname: string;
  genderCode: string | null;
  bio: string | null;
  avatarUrl: string | null;
  heartsCount: number;
  createdAt: string;
  updatedAt: string;
};

type BackendDogResponse = {
  dogId: number;
  guardianUserId: number | null;
  name: string;
  breed: string | null;
  ageYears: number | null;
  genderCode: string | null;
  isNeutered: boolean | null;
  vaccinationNote: string | null;
  dispositionText: string | null;
  photoUrl: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

type BackendDogListResponse = {
  items: BackendDogResponse[];
};

const PROFILE_PATH = "/api/profile";
const DOG_PATH = "/api/dogs";

function isNotFoundError(err: unknown) {
  if (!(err instanceof Error) || typeof err.message !== "string") {
    return false;
  }
  const msg = err.message.toLowerCase();
  return msg.includes("404") || msg.includes("not_found");
}

function mapGuardian(res: BackendProfileResponse): GuardianProfileDTO {
  return {
    userId: res.userId,
    nickname: res.nickname,
    genderCode: res.genderCode,
    bio: res.bio,
    avatarUrl: res.avatarUrl,
    heartsCount: res.heartsCount ?? 0,
    reviewCount: 0,
    createdAt: res.createdAt,
    updatedAt: res.updatedAt,
  };
}

function mapDog(res: BackendDogResponse): DogProfileDTO {
  return {
    id: res.dogId,
    guardianUserId: res.guardianUserId ?? 0,
    name: res.name,
    breed: res.breed,
    ageYears: res.ageYears,
    genderCode: res.genderCode,
    isNeutered: res.isNeutered,
    vaccinationNote: res.vaccinationNote,
    dispositionText: res.dispositionText,
    photoUrl: res.photoUrl,
    createdAt: res.createdAt ?? "",
    updatedAt: res.updatedAt ?? "",
  };
}

function mapGenderForBackend(code?: string | null) {
  if (!code) return null;
  const normalized = code.trim().toUpperCase();
  if (normalized === "M" || normalized === "MALE") return "MALE";
  if (normalized === "F" || normalized === "FEMALE") return "FEMALE";
  if (normalized === "UNKNOWN" || normalized === "U") return "UNKNOWN";
  return null;
}

export async function getProfile(): Promise<ProfileResponse> {
  const auth = useAuthStore.getState();
  const baseUser = {
    id: auth.userId ?? 0,
    phoneNumber: auth.phoneNumber ?? "",
    createdAt: "",
  };

  let guardian: GuardianProfileDTO | null = null;
  try {
    const res = await apiFetch<BackendProfileResponse>(`${PROFILE_PATH}/me`, {
      method: "GET",
      auth: "required",
    });
    guardian = mapGuardian(res);
  } catch (e) {
    if (!isNotFoundError(e)) throw e;
  }

  let dogs: DogProfileDTO[] = [];
  try {
    const res = await apiFetch<BackendDogListResponse>(`${DOG_PATH}/me`, {
      method: "GET",
      auth: "required",
    });
    dogs = (res.items ?? []).map(mapDog);
  } catch (e) {
    if (!isNotFoundError(e)) throw e;
  }

  return {
    user: baseUser,
    guardianProfile: guardian,
    neighborhood: null,
    dogs,
    profileExists: guardian != null,
  };
}

type UpsertProfileMode = "auto" | "create" | "update";

export async function upsertProfile(
  body: UpsertProfileRequest,
  opts: { mode?: UpsertProfileMode } = {},
) {
  const payload = {
    nickname: body.nickname?.trim(),
    genderCode: mapGenderForBackend(body.genderCode),
    bio: body.bio ?? null,
    avatarUrl: body.avatarUrl ?? null,
  };

  if (!payload.nickname) {
    throw new Error("닉네임은 필수 항목입니다.");
  }

  const mode = opts.mode ?? "auto";

  const doUpdate = () =>
    apiFetch<BackendProfileResponse>(`${PROFILE_PATH}/me`, {
      method: "PUT",
      auth: "required",
      body: JSON.stringify(payload),
    });

  const doCreate = () =>
    apiFetch<BackendProfileResponse>(`${PROFILE_PATH}`, {
      method: "POST",
      auth: "required",
      body: JSON.stringify(payload),
    });

  if (mode === "create") {
    await doCreate();
  } else if (mode === "update") {
    await doUpdate();
  } else {
    try {
      await doUpdate();
    } catch (e) {
      if (!isNotFoundError(e)) throw e;
      await doCreate();
    }
  }

  return getProfile();
}

export async function createDog(body: UpsertDogProfileRequest) {
  await apiFetch<BackendDogResponse>(`${DOG_PATH}`, {
    method: "POST",
    auth: "required",
    body: JSON.stringify({
      ...body,
      breed: body.breed ?? null,
      genderCode: body.genderCode ?? null,
      vaccinationNote: body.vaccinationNote ?? null,
      dispositionText: body.dispositionText ?? null,
      photoUrl: body.photoUrl ?? null,
    }),
  });
  return getProfile();
}

export async function updateDog(dogId: number, body: UpsertDogProfileRequest) {
  await apiFetch<BackendDogResponse>(`${DOG_PATH}/${dogId}`, {
    method: "PUT",
    auth: "required",
    body: JSON.stringify({
      ...body,
      breed: body.breed ?? null,
      genderCode: body.genderCode ?? null,
      vaccinationNote: body.vaccinationNote ?? null,
      dispositionText: body.dispositionText ?? null,
      photoUrl: body.photoUrl ?? null,
    }),
  });
  return getProfile();
}

export async function deleteDog(dogId: number) {
  await apiFetch(`${DOG_PATH}/${dogId}`, {
    method: "DELETE",
    auth: "required",
  });
  return getProfile();
}
