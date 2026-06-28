"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { OwnProfile } from "@/lib/types";

export const myProfileKey = ["profile", "me"] as const;

export function profileNeedsOnboarding(profile: OwnProfile | null | undefined) {
  return !profile || (profile.status !== "READY" && profile.status !== "SKIPPED");
}

export function useMyProfile(enabled = true) {
  return useQuery<OwnProfile | null>({
    queryKey: myProfileKey,
    enabled,
    queryFn: async () => {
      const res = await api.getMyProfile();
      return res.profile;
    },
    staleTime: 15_000,
  });
}

function useWriteProfile() {
  const qc = useQueryClient();

  return (profile: OwnProfile | null) => {
    qc.setQueryData(myProfileKey, profile);
  };
}

export function useSubmitProfileStory() {
  const writeProfile = useWriteProfile();

  return useMutation({
    mutationFn: (story: string) => api.submitProfileStory(story),
    onSuccess: (response) => {
      writeProfile(response.profile);
    },
  });
}

export function useConfirmProfileTags() {
  const writeProfile = useWriteProfile();

  return useMutation({
    mutationFn: (tags: string[]) => api.confirmProfileTags(tags),
    onSuccess: (response) => {
      writeProfile(response.profile);
    },
  });
}

export function useSkipProfile() {
  const writeProfile = useWriteProfile();

  return useMutation({
    mutationFn: () => api.skipProfile(),
    onSuccess: (response) => {
      writeProfile(response.profile);
    },
  });
}
