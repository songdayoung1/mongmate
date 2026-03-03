import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createDog,
  deleteDog,
  getProfile,
  upsertProfile,
  updateDog,
  type ProfileResponse,
  type UpsertDogProfileRequest,
  type UpsertProfileRequest,
} from "../api/profile";
import { useLocalMediaStore } from "../store/localMedia";

const QK = {
  profile: ["profile"] as const,
};

export function useProfile() {
  const avatarOverride = useLocalMediaStore((s) => s.profileAvatarUri);
  const query = useQuery({
    queryKey: QK.profile,
    queryFn: getProfile,
    staleTime: 10_000,
  });

  const mergedData = useMemo<ProfileResponse | undefined>(() => {
    if (!query.data) return query.data;
    if (!avatarOverride) return query.data;
    if (!query.data.guardianProfile) {
      return {
        ...query.data,
        guardianProfile: {
          userId: 0,
          nickname: query.data.user.phoneNumber ?? "사용자",
          genderCode: null,
          bio: null,
          avatarUrl: avatarOverride,
          heartsCount: 0,
          reviewCount: 0,
          createdAt: "",
          updatedAt: "",
        },
      };
    }
    return {
      ...query.data,
      guardianProfile: {
        ...query.data.guardianProfile,
        avatarUrl: avatarOverride || query.data.guardianProfile.avatarUrl,
      },
    };
  }, [avatarOverride, query.data]);

  return { ...query, data: mergedData };
}

type UpsertProfileMutationArgs = {
  body: UpsertProfileRequest;
  mode?: "auto" | "create" | "update";
};

export function useUpsertProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: UpsertProfileMutationArgs) =>
      upsertProfile(args.body, { mode: args.mode }),
    onSuccess: (data) => qc.setQueryData(QK.profile, data),
  });
}

export function useCreateDog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpsertDogProfileRequest) => createDog(body),
    onSuccess: (data) => qc.setQueryData(QK.profile, data),
  });
}

export function useUpdateDog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { dogId: number; body: UpsertDogProfileRequest }) =>
      updateDog(vars.dogId, vars.body),
    onSuccess: (data) => qc.setQueryData(QK.profile, data),
  });
}

export function useDeleteDog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dogId: number) => deleteDog(dogId),
    onSuccess: (data) => qc.setQueryData(QK.profile, data),
  });
}
