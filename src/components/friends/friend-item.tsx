"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { MessageCircle, UserMinus } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useConversations } from "@/hooks/use-conversations";
import { useUnfriend } from "@/hooks/use-friends";
import { useAuth } from "@/providers/auth-provider";
import type { Friend } from "@/lib/types";

export function FriendItem({ friend }: { friend: Friend }) {
  const router = useRouter();
  const { onlineUserIds } = useAuth();
  const { data: conversations } = useConversations();
  const unfriend = useUnfriend();

  function message() {
    // Reuse an existing conversation with this friend if we have one.
    const existing = conversations?.find((c) =>
      c.members.some((m) => m.userId === friend.id),
    );
    if (existing) {
      router.push(`/chat/${existing.id}`);
      return;
    }
    const params = new URLSearchParams({ to: friend.id, name: friend.userName });
    if (friend.profilePictureUrl) params.set("avatar", friend.profilePictureUrl);
    router.push(`/chat/new?${params.toString()}`);
  }

  return (
    <li className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-accent/60">
      <Avatar
        src={friend.profilePictureUrl}
        name={friend.userName}
        className="size-11"
        online={onlineUserIds.has(friend.id)}
      />
      <div className="min-w-0 flex-1">
        <Link
          href={`/profile/${friend.id}`}
          className="block truncate font-medium hover:underline focus-visible:underline focus-visible:outline-none"
        >
          {friend.userName}
        </Link>
        <p className="truncate text-xs text-muted-foreground">
          {friend.userUniqueID ? `${friend.userUniqueID} · ` : ""}
          {friend.email}
        </p>
      </div>
      <Button variant="outline" size="sm" onClick={message}>
        <MessageCircle className="size-4" />
        Message
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label={`Remove ${friend.userName}`}
        title="Remove friend"
        disabled={unfriend.isPending}
        onClick={() => unfriend.mutate(friend.id)}
        className="text-muted-foreground hover:text-destructive"
      >
        {unfriend.isPending ? (
          <Spinner className="size-4" />
        ) : (
          <UserMinus className="size-4" />
        )}
      </Button>
    </li>
  );
}
