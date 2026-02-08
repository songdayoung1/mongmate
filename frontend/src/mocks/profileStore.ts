import AsyncStorage from "@react-native-async-storage/async-storage";
import { myProfile } from "./myProfile";
import { dogProfile } from "./dogProfile";
import type {
  ProfileResponse,
  UpsertDogProfileRequest,
  UpsertProfileRequest,
} from "../api/profile";

const KEY = "mock_profile_v1";

/**
 * ✅ 앱에서 쓰는 형태(ProfileResponse)로 초기값 구성
 * - neighborhood는 미구현이라 null 고정
 */
function buildDefault(): ProfileResponse {
  return {
    user: {
      id: myProfile.user.id,
      phoneNumber: myProfile.user.phoneNumber,
      createdAt: myProfile.user.createdAt,
    },
    guardianProfile: {
      userId: myProfile.guardianProfile.userId,
      nickname: myProfile.guardianProfile.nickname,
      genderCode: myProfile.guardianProfile.genderCode,
      bio: myProfile.guardianProfile.bio,
      avatarUrl: myProfile.guardianProfile.avatarUrl,
      heartsCount: myProfile.guardianProfile.heartsCount,
      reviewCount: myProfile.guardianProfile.reviewCount,
      createdAt: myProfile.guardianProfile.createdAt,
      updatedAt: myProfile.guardianProfile.updatedAt,
    },
    neighborhood: null,
    dogs: dogProfile.map((d) => ({ ...d })),
  };
}

export async function loadProfile(): Promise<ProfileResponse> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) {
    const init = buildDefault();
    await AsyncStorage.setItem(KEY, JSON.stringify(init));
    return init;
  }

  try {
    return JSON.parse(raw) as ProfileResponse;
  } catch {
    const init = buildDefault();
    await AsyncStorage.setItem(KEY, JSON.stringify(init));
    return init;
  }
}

export async function saveProfile(profile: ProfileResponse) {
  await AsyncStorage.setItem(KEY, JSON.stringify(profile));
}

export async function resetProfile() {
  const init = buildDefault();
  await AsyncStorage.setItem(KEY, JSON.stringify(init));
  return init;
}

export async function upsertMyProfile(body: UpsertProfileRequest) {
  const prev = await loadProfile();
  const now = new Date().toISOString();

  const next: ProfileResponse = {
    ...prev,
    guardianProfile: {
      ...(prev.guardianProfile ?? {
        userId: prev.user.id,
        nickname: body.guardian.nickname,
        genderCode: null,
        bio: null,
        avatarUrl: null,
        heartsCount: 0,
        reviewCount: 0,
        createdAt: now,
        updatedAt: now,
      }),
      nickname: body.guardian.nickname,
      genderCode: body.guardian.genderCode ?? null,
      bio: body.guardian.bio ?? null,
      avatarUrl: body.guardian.avatarUrl ?? null,
      updatedAt: now,
    },
    // ✅ 위치 미구현 고정
    neighborhood: null,
  };

  await saveProfile(next);
  return next;
}

export async function createDogInStore(body: UpsertDogProfileRequest) {
  const prev = await loadProfile();
  const now = new Date().toISOString();
  const nextId = prev.dogs.reduce((max, d) => Math.max(max, d.id), 0) + 1;

  const newDog = {
    id: nextId,
    guardianUserId: prev.user.id,
    name: body.name,
    breed: body.breed ?? null,
    ageYears: body.ageYears ?? null,
    genderCode: body.genderCode ?? null,
    isNeutered: body.isNeutered ?? null,
    vaccinationNote: body.vaccinationNote ?? null,
    dispositionText: body.dispositionText ?? null,
    photoUrl: body.photoUrl ?? null,
    createdAt: now,
    updatedAt: now,
  };

  const next: ProfileResponse = { ...prev, dogs: [newDog, ...prev.dogs] };
  await saveProfile(next);
  return next;
}

export async function updateDogInStore(
  dogId: number,
  body: UpsertDogProfileRequest,
) {
  const prev = await loadProfile();
  const now = new Date().toISOString();

  const nextDogs = prev.dogs.map((d) =>
    d.id !== dogId
      ? d
      : {
          ...d,
          name: body.name,
          breed: body.breed ?? null,
          ageYears: body.ageYears ?? null,
          genderCode: body.genderCode ?? null,
          isNeutered: body.isNeutered ?? null,
          vaccinationNote: body.vaccinationNote ?? null,
          dispositionText: body.dispositionText ?? null,
          photoUrl: body.photoUrl ?? null,
          updatedAt: now,
        },
  );

  const next: ProfileResponse = { ...prev, dogs: nextDogs };
  await saveProfile(next);
  return next;
}

export async function deleteDogInStore(dogId: number) {
  const prev = await loadProfile();
  const next: ProfileResponse = {
    ...prev,
    dogs: prev.dogs.filter((d) => d.id !== dogId),
  };
  await saveProfile(next);
  return next;
}
