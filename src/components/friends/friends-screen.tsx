"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  RefreshCw,
  Search,
  Sparkles,
  UserPlus,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  useFriendSuggestions,
  useFriends,
  useIncomingRequests,
  useOutgoingRequests,
} from "@/hooks/use-friends";
import { FriendItem } from "./friend-item";
import { FriendSuggestionItem } from "./friend-suggestion-item";
import { IncomingRequestItem, OutgoingRequestItem } from "./request-item";
import { cn } from "@/lib/utils";

type Tab = "friends" | "suggestions" | "requests";

export function FriendsScreen() {
  const [tab, setTab] = React.useState<Tab>("friends");
  const [search, setSearch] = React.useState("");

  const friends = useFriends(tab === "friends" ? search : "");
  const suggestions = useFriendSuggestions(8, tab === "suggestions");
  const incoming = useIncomingRequests();
  const outgoing = useOutgoingRequests();

  const pendingCount = incoming.data?.length ?? 0;
  const suggestionCount = suggestions.data?.length ?? 0;

  const refresh = () => {
    if (tab === "friends") {
      void friends.refetch();
    }
    else if (tab === "suggestions") {
      void suggestions.refetch();
    }
    else {
      void incoming.refetch();
      void outgoing.refetch();
    }
  };

  const refreshing =
    tab === "friends"
      ? friends.isFetching
      : tab === "suggestions"
        ? suggestions.isFetching
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
          aria-label="Friends, suggestions, and requests"
          className="inline-flex rounded-lg border border-border p-0.5"
        >
          <TabButton
            active={tab === "friends"}
            onClick={() => setTab("friends")}
          >
            Friends
          </TabButton>
          <TabButton
            active={tab === "suggestions"}
            onClick={() => setTab("suggestions")}
          >
            Suggestions
            {suggestionCount > 0 && (
              <span
                className={cn(
                  "ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold",
                  tab === "suggestions"
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-primary text-primary-foreground",
                )}
              >
                {suggestionCount}
              </span>
            )}
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
        ) : tab === "suggestions" ? (
          <SuggestionsTab query={suggestions} />
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
    <section>
      <SectionLabel icon={<Users className="size-3.5" />}>
        {friends.length} {friends.length === 1 ? "friend" : "friends"}
      </SectionLabel>
      <ul>
        {friends.map((f) => (
          <FriendItem key={f.id} friend={f} />
        ))}
      </ul>
    </section>
  );
}

function SuggestionsTab({
  query,
}: {
  query: ReturnType<typeof useFriendSuggestions>;
}) {
  if (query.isPending) {
    return (
      <section>
        <SectionLabel icon={<Sparkles className="size-3.5" />}>
          Suggested for you
        </SectionLabel>
        <div className="flex items-center gap-2 rounded-xl px-3 py-4 text-sm text-muted-foreground">
          <Spinner className="size-4" />
          Finding people who match your tags…
        </div>
      </section>
    );
  }

  if (query.isError) {
    return (
      <section>
        <SectionLabel icon={<Sparkles className="size-3.5" />}>
          Suggested for you
        </SectionLabel>
        <div className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-card/70 px-3 py-3 text-sm">
          <p className="text-muted-foreground">
            We couldn&apos;t load suggestions right now.
          </p>
          <Button variant="outline" size="sm" onClick={() => void query.refetch()}>
            Try again
          </Button>
        </div>
      </section>
    );
  }

  const suggestions = query.data ?? [];
  if (suggestions.length === 0) {
    return (
      <Centered
        icon={<Sparkles className="size-6" />}
        title="No suggestions yet"
        body="We’ll show people here when their profile tags overlap with yours."
      />
    );
  }

  return (
    <section>
      <SectionLabel icon={<Sparkles className="size-3.5" />}>
        Suggested for you · {suggestions.length}
      </SectionLabel>
      <ul className="space-y-3">
        {suggestions.map((suggestion) => (
          <FriendSuggestionItem key={suggestion.id} suggestion={suggestion} />
        ))}
      </ul>
    </section>
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
