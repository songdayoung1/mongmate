import { apiFetch } from "./client";

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

const BASE_PATH = "/api/me";

export async function getProfile() {
  return apiFetch<ProfileResponse>(BASE_PATH, {
    method: "GET",
    auth: "required",
  });
}

export async function upsertProfile(body: UpsertProfileRequest) {
  return apiFetch<ProfileResponse>(`${BASE_PATH}/profile`, {
    method: "PUT",
    auth: "required",
    body: JSON.stringify(body),
  });
}

export async function createDog(body: UpsertDogProfileRequest) {
  return apiFetch<ProfileResponse>(`${BASE_PATH}/dogs`, {
    method: "POST",
    auth: "required",
    body: JSON.stringify(body),
  });
}

export async function updateDog(dogId: number, body: UpsertDogProfileRequest) {
  return apiFetch<ProfileResponse>(`${BASE_PATH}/dogs/${dogId}`, {
    method: "PUT",
    auth: "required",
    body: JSON.stringify(body),
  });
}

export async function deleteDog(dogId: number) {
  return apiFetch<ProfileResponse>(`${BASE_PATH}/dogs/${dogId}`, {
    method: "DELETE",
    auth: "required",
  });
}
