"use client";

import { Check, Clock, UserCheck, UserPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  useAcceptRequest,
  useCancelRequest,
  useFriendshipStatus,
  useSendFriendRequest,
} from "@/hooks/use-friends";

/**
 * Self-contained friend action for a given user. Reads the relationship status
 * and renders the appropriate control (add / requested / accept / friends).
 * Drop it anywhere a user is shown (search results, nearby, profile).
 */
export function AddFriendButton({
  userId,
  size = "sm",
}: {
  userId: string;
  size?: "sm" | "default";
}) {
  const { data, isPending } = useFriendshipStatus(userId);
  const send = useSendFriendRequest();
  const accept = useAcceptRequest();
  const cancel = useCancelRequest();

  if (isPending) {
    return (
      <Button variant="outline" size={size} disabled>
        <Spinner className="size-4" />
      </Button>
    );
  }

  const status = data?.status ?? "NONE";
  const requestId = data?.requestId;
  const busy = send.isPending || accept.isPending || cancel.isPending;

  if (status === "SELF" || status === "BLOCKED") return null;

  if (status === "FRIENDS") {
    return (
      <Button variant="ghost" size={size} disabled className="text-muted-foreground">
        <UserCheck className="size-4" />
        Friends
      </Button>
    );
  }

  if (status === "REQUEST_INCOMING") {
    return (
      <Button
        variant="default"
        size={size}
        disabled={busy || !requestId}
        onClick={() => requestId && accept.mutate(requestId)}
      >
        <Check className="size-4" />
        Accept
      </Button>
    );
  }

  if (status === "REQUEST_OUTGOING") {
    return (
      <Button
        variant="outline"
        size={size}
        disabled={busy || !requestId}
        onClick={() => requestId && cancel.mutate(requestId)}
        title="Cancel request"
        className="group"
      >
        <Clock className="size-4 group-hover:hidden" />
        <X className="hidden size-4 group-hover:block" />
        <span className="group-hover:hidden">Requested</span>
        <span className="hidden group-hover:inline">Cancel</span>
      </Button>
    );
  }

  // status === "NONE"
  return (
    <Button
      variant="default"
      size={size}
      disabled={busy}
      onClick={() => send.mutate(userId)}
    >
      <UserPlus className="size-4" />
      Add friend
    </Button>
  );
}
