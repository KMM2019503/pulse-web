"use client";

import * as React from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  Friend,
  FriendRequest,
  FriendshipState,
} from "@/lib/types";

/* ---- Query keys ---- */
export const friendsKey = (q?: string) => ["friends", q ?? ""] as const;
export const incomingRequestsKey = ["friend-requests", "incoming"] as const;
export const outgoingRequestsKey = ["friend-requests", "outgoing"] as const;
export const friendshipStatusKey = (userId: string) =>
  ["friendship-status", userId] as const;

/** Debounce a fast-changing value (mirrors use-user-search). */
function useDebounced<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export function useFriends(rawQuery = "") {
  const q = useDebounced(rawQuery.trim(), 300);
  return useQuery<Friend[]>({
    queryKey: friendsKey(q),
    queryFn: async ({ signal }) => {
      const res = await api.listFriends(q || undefined, signal);
      return res.friends ?? [];
    },
    staleTime: 15_000,
  });
}

export function useIncomingRequests() {
  return useQuery<FriendRequest[]>({
    queryKey: incomingRequestsKey,
    queryFn: async () => {
      const res = await api.listIncomingRequests();
      return res.requests ?? [];
    },
  });
}

export function useOutgoingRequests() {
  return useQuery<FriendRequest[]>({
    queryKey: outgoingRequestsKey,
    queryFn: async () => {
      const res = await api.listOutgoingRequests();
      return res.requests ?? [];
    },
  });
}

export type FriendshipStatusData = {
  status: FriendshipState;
  requestId?: string;
};

export function useFriendshipStatus(userId: string, enabled = true) {
  return useQuery<FriendshipStatusData>({
    queryKey: friendshipStatusKey(userId),
    enabled: enabled && !!userId,
    queryFn: async ({ signal }) => {
      const res = await api.getFriendshipStatus(userId, signal);
      return { status: res.status, requestId: res.requestId };
    },
    staleTime: 15_000,
  });
}

/**
 * Invalidate every friends-related query. Friend actions ripple across the
 * lists (friends, incoming, outgoing) and per-user status badges, so the
 * simplest correct refresh is to drop them all.
 */
function useInvalidateFriends() {
  const qc = useQueryClient();
  return React.useCallback(() => {
    void qc.invalidateQueries({ queryKey: ["friends"] });
    void qc.invalidateQueries({ queryKey: ["friend-requests"] });
    void qc.invalidateQueries({ queryKey: ["friendship-status"] });
  }, [qc]);
}

export function useSendFriendRequest() {
  const invalidate = useInvalidateFriends();
  return useMutation({
    mutationFn: (receiverId: string) => api.sendFriendRequest(receiverId),
    onSuccess: invalidate,
  });
}

export function useAcceptRequest() {
  const invalidate = useInvalidateFriends();
  return useMutation({
    mutationFn: (requestId: string) => api.acceptFriendRequest(requestId),
    onSuccess: invalidate,
  });
}

export function useRejectRequest() {
  const invalidate = useInvalidateFriends();
  return useMutation({
    mutationFn: (requestId: string) => api.rejectFriendRequest(requestId),
    onSuccess: invalidate,
  });
}

export function useCancelRequest() {
  const invalidate = useInvalidateFriends();
  return useMutation({
    mutationFn: (requestId: string) => api.cancelFriendRequest(requestId),
    onSuccess: invalidate,
  });
}

export function useUnfriend() {
  const invalidate = useInvalidateFriends();
  return useMutation({
    mutationFn: (friendId: string) => api.unfriend(friendId),
    onSuccess: invalidate,
  });
}
