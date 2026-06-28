"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { ArrowLeft, MessageCircle, Settings, UserX } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ThemeToggle } from "@/components/theme-toggle";
import { AddFriendButton } from "@/components/friends/add-friend-button";
import { useConversations } from "@/hooks/use-conversations";
import { usePublicProfile } from "@/hooks/use-profile";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";

export function PublicProfileScreen({ userId }: { userId: string }) {
  const router = useRouter();
  const { user: me, onlineUserIds } = useAuth();
  const { data: conversations } = useConversations();
  const query = usePublicProfile(userId);

  const isSelf = me?.id === userId;
  const notReady =
    query.isError && query.error instanceof ApiError && query.error.status === 404;

  function messageUser(userName: string, avatar?: string | null) {
    const existing = conversations?.find((c) =>
      c.members.some((m) => m.userId === userId),
    );
    if (existing) {
      router.push(`/chat/${existing.id}`);
      return;
    }
    const params = new URLSearchParams({ to: userId, name: userName });
    if (avatar) params.set("avatar", avatar);
    router.push(`/chat/new?${params.toString()}`);
  }

  return (
    <div className="flex h-dvh flex-col">
      <header className="flex items-center justify-between px-4 py-3.5">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Go back"
            title="Go back"
            onClick={() => router.back()}
          >
            <ArrowLeft className="size-4.5" />
          </Button>
          <h1 className="text-base font-semibold">Profile</h1>
        </div>
        <ThemeToggle />
      </header>

      <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-4 pb-10 sm:px-6">
        <div className="mx-auto w-full max-w-2xl py-2">
          {query.isPending ? (
            <Centered icon={<Spinner className="size-6" />} title="Loading profile…" />
          ) : query.isError ? (
            <Centered
              icon={<UserX className="size-6" />}
              title={notReady ? "Profile unavailable" : "Couldn’t load profile"}
              body={
                notReady
                  ? "This person hasn’t finished setting up their profile, or it doesn’t exist."
                  : query.error instanceof Error
                    ? query.error.message
                    : undefined
              }
              action={
                notReady ? (
                  <Button variant="outline" size="sm" onClick={() => router.back()}>
                    Go back
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => void query.refetch()}>
                    Try again
                  </Button>
                )
              }
            />
          ) : (
            <article className="rounded-3xl border border-border/70 bg-card/85 p-6 shadow-sm">
              <div className="flex flex-col items-center text-center">
                <Avatar
                  src={query.data.user.profilePictureUrl}
                  name={query.data.user.userName}
                  className="size-24"
                  online={onlineUserIds.has(userId)}
                />
                <h2 className="mt-4 text-xl font-semibold">
                  {query.data.user.userName}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {query.data.user.userUniqueID && (
                    <span>{query.data.user.userUniqueID}</span>
                  )}
                  {query.data.user.lastActiveAt && (
                    <span>
                      {query.data.user.userUniqueID ? " · " : ""}
                      Active{" "}
                      {formatDistanceToNow(new Date(query.data.user.lastActiveAt), {
                        addSuffix: true,
                      })}
                    </span>
                  )}
                </p>

                <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                  {isSelf ? (
                    <Button asChild variant="outline" size="sm">
                      <Link href="/settings">
                        <Settings className="size-4" />
                        Edit your profile
                      </Link>
                    </Button>
                  ) : (
                    <>
                      <AddFriendButton userId={userId} />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          messageUser(
                            query.data.user.userName,
                            query.data.user.profilePictureUrl,
                          )
                        }
                      >
                        <MessageCircle className="size-4" />
                        Message
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {query.data.profile.summary && (
                <div className="mt-6 rounded-2xl bg-secondary px-4 py-3 text-center">
                  <p className="text-sm leading-6">{query.data.profile.summary}</p>
                </div>
              )}

              {query.data.profile.tags.length > 0 && (
                <div className="mt-6">
                  <p className="mb-3 text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                    Tags
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {query.data.profile.tags.map((tag) => (
                      <span
                        key={tag.slug}
                        className="rounded-full border border-border bg-background/80 px-2.5 py-1 text-xs font-medium text-foreground/80"
                      >
                        {tag.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </article>
          )}
        </div>
      </div>
    </div>
  );
}

function Centered({
  icon,
  title,
  body,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  body?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-3 px-6 text-center">
      <div className="text-muted-foreground">{icon}</div>
      <div className="space-y-1">
        <p className="font-medium">{title}</p>
        {body && (
          <p className="mx-auto max-w-xs text-sm text-muted-foreground">{body}</p>
        )}
      </div>
      {action}
    </div>
  );
}
