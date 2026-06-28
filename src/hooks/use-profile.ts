"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  OwnProfile,
  ProfileResponse,
  UpdateProfileInput,
  User,
} from "@/lib/types";

export const myProfileKey = ["profile", "me"] as const;
export const publicProfileKey = (userId: string) =>
  ["profile", "public", userId] as const;

/** The authenticated user's account + persona, as cached under `myProfileKey`. */
export type ProfileMe = {
  user: User;
  profile: OwnProfile | null;
};

export function profileNeedsOnboarding(profile: OwnProfile | null | undefined) {
  return !profile || (profile.status !== "READY" && profile.status !== "SKIPPED");
}

async function fetchProfileMe(): Promise<ProfileMe> {
  const res = await api.getMyProfile();
  return { user: res.user, profile: res.profile };
}

/**
 * The persona portion of the current user's profile. Shares one cache entry
 * (and one network request) with {@link useProfileMe} via the `select` option,
 * so existing callers that only need the persona keep working unchanged.
 */
export function useMyProfile(enabled = true) {
  return useQuery({
    queryKey: myProfileKey,
    enabled,
    queryFn: fetchProfileMe,
    select: (data) => data.profile,
    staleTime: 15_000,
  });
}

/** Full account + persona for the settings screen. */
export function useProfileMe(enabled = true) {
  return useQuery({
    queryKey: myProfileKey,
    enabled,
    queryFn: fetchProfileMe,
    staleTime: 15_000,
  });
}

function useWriteProfileMe() {
  const qc = useQueryClient();

  return (response: ProfileResponse) => {
    qc.setQueryData<ProfileMe>(myProfileKey, {
      user: response.user,
      profile: response.profile,
    });
  };
}

export function useSubmitProfileStory() {
  const writeProfile = useWriteProfileMe();

  return useMutation({
    mutationFn: (story: string) => api.submitProfileStory(story),
    onSuccess: writeProfile,
  });
}

export function useConfirmProfileTags() {
  const writeProfile = useWriteProfileMe();

  return useMutation({
    mutationFn: (tags: string[]) => api.confirmProfileTags(tags),
    onSuccess: writeProfile,
  });
}

export function useSkipProfile() {
  const writeProfile = useWriteProfileMe();

  return useMutation({
    mutationFn: () => api.skipProfile(),
    onSuccess: writeProfile,
  });
}

export function useUpdateMyProfile() {
  const writeProfile = useWriteProfileMe();

  return useMutation({
    mutationFn: (input: UpdateProfileInput) => api.updateMyProfile(input),
    onSuccess: writeProfile,
  });
}

/**
 * Another user's public profile. Only READY personas resolve; the backend
 * returns 404 otherwise, so we don't retry.
 */
export function usePublicProfile(userId: string, enabled = true) {
  return useQuery({
    queryKey: publicProfileKey(userId),
    enabled: enabled && !!userId,
    queryFn: ({ signal }) => api.getPublicProfile(userId, signal),
    staleTime: 30_000,
    retry: false,
  });
}
