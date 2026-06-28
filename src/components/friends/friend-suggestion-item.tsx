"use client";

import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { AddFriendButton } from "@/components/friends/add-friend-button";
import { useAuth } from "@/providers/auth-provider";
import type { FriendSuggestion } from "@/lib/types";

export function FriendSuggestionItem({
  suggestion,
}: {
  suggestion: FriendSuggestion;
}) {
  const { onlineUserIds } = useAuth();
  const description = suggestion.story ?? suggestion.summary;

  return (
    <li className="rounded-2xl border border-border/70 bg-card/75 p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <Avatar
          src={suggestion.profilePictureUrl}
          name={suggestion.userName}
          className="size-11"
          online={onlineUserIds.has(suggestion.id)}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Link
                href={`/profile/${suggestion.id}`}
                className="block truncate font-medium hover:underline focus-visible:underline focus-visible:outline-none"
              >
                {suggestion.userName}
              </Link>
              <p className="truncate text-xs text-muted-foreground">
                {suggestion.userUniqueID ? `${suggestion.userUniqueID} · ` : ""}
                {suggestion.email}
              </p>
            </div>
            <AddFriendButton userId={suggestion.id} />
          </div>

          {description && (
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          )}

          {suggestion.sharedTags.length > 0 && (
            <p className="mt-3 text-xs font-medium text-primary">
              Shared tags: {suggestion.sharedTags.map((tag) => tag.label).join(", ")}
            </p>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            {suggestion.tags.map((tag) => (
              <span
                key={tag.slug}
                className="rounded-full border border-border bg-background/80 px-2.5 py-1 text-xs font-medium text-foreground/80"
              >
                {tag.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </li>
  );
}
