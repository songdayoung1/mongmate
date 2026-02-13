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

const QK = {
  profile: ["profile"] as const,
};

export function useProfile() {
  return useQuery({
    queryKey: QK.profile,
    queryFn: getProfile,
    staleTime: 10_000,
  });
}

export function useUpsertProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpsertProfileRequest) => upsertProfile(body),
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
