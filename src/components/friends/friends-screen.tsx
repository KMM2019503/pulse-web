"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw, Search, UserPlus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  useFriends,
  useIncomingRequests,
  useOutgoingRequests,
} from "@/hooks/use-friends";
import { FriendItem } from "./friend-item";
import { IncomingRequestItem, OutgoingRequestItem } from "./request-item";
import { cn } from "@/lib/utils";

type Tab = "friends" | "requests";

export function FriendsScreen() {
  const [tab, setTab] = React.useState<Tab>("friends");
  const [search, setSearch] = React.useState("");

  const friends = useFriends(tab === "friends" ? search : "");
  const incoming = useIncomingRequests();
  const outgoing = useOutgoingRequests();

  const pendingCount = incoming.data?.length ?? 0;

  const refresh = () => {
    if (tab === "friends") void friends.refetch();
    else {
      void incoming.refetch();
      void outgoing.refetch();
    }
  };

  const refreshing =
    tab === "friends"
      ? friends.isFetching
      : incoming.isFetching || outgoing.isFetching;

  return (
    <div className="flex h-dvh flex-col">
      <header className="flex items-center justify-between px-4 py-3.5">
        <div className="flex items-center gap-1">
          <Button
            asChild
            variant="ghost"
            size="icon"
            aria-label="Back to messages"
            title="Back to messages"
            className="md:hidden"
          >
            <Link href="/chat">
              <ArrowLeft className="size-4.5" />
            </Link>
          </Button>
          <h1 className="text-base font-semibold">Friends</h1>
        </div>
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Refresh"
            title="Refresh"
            disabled={refreshing}
            onClick={refresh}
          >
            <RefreshCw className={cn("size-4.5", refreshing && "animate-spin")} />
          </Button>
          <ThemeToggle />
        </div>
      </header>

      <div className="px-5 pb-3">
        <div
          role="tablist"
          aria-label="Friends and requests"
          className="inline-flex rounded-lg border border-border p-0.5"
        >
          <TabButton
            active={tab === "friends"}
            onClick={() => setTab("friends")}
          >
            Friends
          </TabButton>
          <TabButton
            active={tab === "requests"}
            onClick={() => setTab("requests")}
          >
            Requests
            {pendingCount > 0 && (
              <span
                className={cn(
                  "ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold",
                  tab === "requests"
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-primary text-primary-foreground",
                )}
              >
                {pendingCount}
              </span>
            )}
          </TabButton>
        </div>

        {tab === "friends" && (
          <div className="relative mt-3">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search friends"
              className="pl-9"
              aria-label="Search friends"
            />
          </div>
        )}
      </div>

      <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-3 pb-4">
        {tab === "friends" ? (
          <FriendsTab query={friends} hasSearch={search.trim().length > 0} />
        ) : (
          <RequestsTab incoming={incoming} outgoing={outgoing} />
        )}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "inline-flex h-8 cursor-pointer items-center rounded-md px-3 text-sm font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function FriendsTab({
  query,
  hasSearch,
}: {
  query: ReturnType<typeof useFriends>;
  hasSearch: boolean;
}) {
  if (query.isPending) {
    return <Centered icon={<Spinner className="size-6" />} title="Loading friends…" />;
  }
  if (query.isError) {
    return (
      <Centered
        icon={<Users className="size-6" />}
        title="Couldn't load friends"
        body={query.error instanceof Error ? query.error.message : undefined}
        action={
          <Button variant="outline" size="sm" onClick={() => void query.refetch()}>
            Try again
          </Button>
        }
      />
    );
  }

  const friends = query.data ?? [];
  if (friends.length === 0) {
    return (
      <Centered
        icon={<Users className="size-6" />}
        title={hasSearch ? "No matches" : "No friends yet"}
        body={
          hasSearch
            ? "No friends match your search."
            : "Find people via search or Nearby and send a request to get started."
        }
      />
    );
  }

  return (
    <>
      <SectionLabel icon={<Users className="size-3.5" />}>
        {friends.length} {friends.length === 1 ? "friend" : "friends"}
      </SectionLabel>
      <ul>
        {friends.map((f) => (
          <FriendItem key={f.id} friend={f} />
        ))}
      </ul>
    </>
  );
}

function RequestsTab({
  incoming,
  outgoing,
}: {
  incoming: ReturnType<typeof useIncomingRequests>;
  outgoing: ReturnType<typeof useOutgoingRequests>;
}) {
  if (incoming.isPending && outgoing.isPending) {
    return <Centered icon={<Spinner className="size-6" />} title="Loading requests…" />;
  }

  const incomingList = incoming.data ?? [];
  const outgoingList = outgoing.data ?? [];

  if (incomingList.length === 0 && outgoingList.length === 0) {
    return (
      <Centered
        icon={<UserPlus className="size-6" />}
        title="No pending requests"
        body="Friend requests you send or receive will show up here."
      />
    );
  }

  return (
    <div className="space-y-4">
      {incomingList.length > 0 && (
        <section>
          <SectionLabel icon={<UserPlus className="size-3.5" />}>
            Incoming · {incomingList.length}
          </SectionLabel>
          <ul>
            {incomingList.map((r) => (
              <IncomingRequestItem key={r.id} request={r} />
            ))}
          </ul>
        </section>
      )}

      {outgoingList.length > 0 && (
        <section>
          <SectionLabel icon={<RefreshCw className="size-3.5" />}>
            Sent · {outgoingList.length}
          </SectionLabel>
          <ul>
            {outgoingList.map((r) => (
              <OutgoingRequestItem key={r.id} request={r} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function SectionLabel({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <p className="flex items-center gap-1.5 px-3 pb-1 pt-1 text-xs font-medium text-muted-foreground">
      {icon}
      {children}
    </p>
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
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
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
