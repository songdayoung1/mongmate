import { apiFetch } from "./client";
import {
  loadProfile,
  upsertMyProfile,
  createDogInStore,
  updateDogInStore,
  deleteDogInStore,
} from "../mocks/profileStore";

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
};

export type UpsertProfileRequest = {
  guardian: {
    nickname: string;
    genderCode?: string | null;
    bio?: string | null;
    avatarUrl?: string | null;
  };
  neighborhood?: {
    regionId: number;
    radiusMeters?: number | null;
    active?: boolean;
  } | null;
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

// ✅ 개발 중 mock 사용. 백엔드 연결되면 false로
const USE_MOCK = true;

// ---------------- Mock (AsyncStorage 기반) ----------------
async function mockGetProfile() {
  return loadProfile();
}
async function mockUpsertProfile(body: UpsertProfileRequest) {
  return upsertMyProfile(body);
}
async function mockCreateDog(body: UpsertDogProfileRequest) {
  return createDogInStore(body);
}
async function mockUpdateDog(dogId: number, body: UpsertDogProfileRequest) {
  return updateDogInStore(dogId, body);
}
async function mockDeleteDog(dogId: number) {
  return deleteDogInStore(dogId);
}

// ---------------- Real API (추후) ----------------
export async function getProfile() {
  if (USE_MOCK) return mockGetProfile();
  return apiFetch<ProfileResponse>("/api/me", { method: "GET" });
}

export async function upsertProfile(body: UpsertProfileRequest) {
  if (USE_MOCK) return mockUpsertProfile(body);
  return apiFetch<ProfileResponse>("/api/me/profile", {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export async function createDog(body: UpsertDogProfileRequest) {
  if (USE_MOCK) return mockCreateDog(body);
  return apiFetch<ProfileResponse>("/api/me/dogs", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateDog(dogId: number, body: UpsertDogProfileRequest) {
  if (USE_MOCK) return mockUpdateDog(dogId, body);
  return apiFetch<ProfileResponse>(`/api/me/dogs/${dogId}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export async function deleteDog(dogId: number) {
  if (USE_MOCK) return mockDeleteDog(dogId);
  return apiFetch<ProfileResponse>(`/api/me/dogs/${dogId}`, {
    method: "DELETE",
  });
}
