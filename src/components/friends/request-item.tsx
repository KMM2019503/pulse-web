"use client";

import Link from "next/link";
import { Check, X } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  useAcceptRequest,
  useCancelRequest,
  useRejectRequest,
} from "@/hooks/use-friends";
import type { FriendRequest, UserSearchResult } from "@/lib/types";

function Row({
  user,
  children,
}: {
  user?: UserSearchResult;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-accent/60">
      <Avatar
        src={user?.profilePictureUrl}
        name={user?.userName}
        className="size-11"
      />
      <div className="min-w-0 flex-1">
        {user?.id ? (
          <Link
            href={`/profile/${user.id}`}
            className="block truncate font-medium hover:underline focus-visible:underline focus-visible:outline-none"
          >
            {user.userName}
          </Link>
        ) : (
          <p className="truncate font-medium">Unknown</p>
        )}
        <p className="truncate text-xs text-muted-foreground">
          {user?.userUniqueID ? `${user.userUniqueID} · ` : ""}
          {user?.email}
        </p>
      </div>
      <div className="flex items-center gap-1.5">{children}</div>
    </li>
  );
}

/** Incoming request — accept or decline. */
export function IncomingRequestItem({ request }: { request: FriendRequest }) {
  const accept = useAcceptRequest();
  const reject = useRejectRequest();
  const busy = accept.isPending || reject.isPending;

  return (
    <Row user={request.sender}>
      <Button
        variant="default"
        size="sm"
        disabled={busy}
        onClick={() => accept.mutate(request.id)}
      >
        {accept.isPending ? <Spinner className="size-4" /> : <Check className="size-4" />}
        Accept
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Decline request"
        title="Decline"
        disabled={busy}
        onClick={() => reject.mutate(request.id)}
        className="text-muted-foreground hover:text-destructive"
      >
        <X className="size-4" />
      </Button>
    </Row>
  );
}

/** Outgoing request — cancel it. */
export function OutgoingRequestItem({ request }: { request: FriendRequest }) {
  const cancel = useCancelRequest();

  return (
    <Row user={request.receiver}>
      <Button
        variant="outline"
        size="sm"
        disabled={cancel.isPending}
        onClick={() => cancel.mutate(request.id)}
      >
        {cancel.isPending ? <Spinner className="size-4" /> : <X className="size-4" />}
        Cancel
      </Button>
    </Row>
  );
}
