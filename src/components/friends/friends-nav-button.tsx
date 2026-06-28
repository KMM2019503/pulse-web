"use client";

import Link from "next/link";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIncomingRequests } from "@/hooks/use-friends";

/** Icon-only link to the Friends screen, with a pending-request badge. */
export function FriendsNavButton() {
  const { data } = useIncomingRequests();
  const pending = data?.length ?? 0;

  return (
    <Button
      asChild
      variant="ghost"
      size="icon"
      aria-label={
        pending > 0 ? `Friends (${pending} pending requests)` : "Friends"
      }
      title="Friends"
      className="relative"
    >
      <Link href="/friends">
        <Users className="size-4.5" />
        {pending > 0 && (
          <span className="absolute right-1 top-1 flex size-2 rounded-full bg-primary ring-2 ring-sidebar" />
        )}
      </Link>
    </Button>
  );
}
