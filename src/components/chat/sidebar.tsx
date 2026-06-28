"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { ComposeIconButton } from "./compose-button";
import { ConversationList } from "./conversation-list";
import { SidebarUserButton } from "./sidebar-user-button";
import { NearbyNavButton } from "@/components/nearby/nearby-nav-button";
import { FriendsNavButton } from "@/components/friends/friends-nav-button";
import { cn } from "@/lib/utils";

export function Sidebar({ className }: { className?: string }) {
  return (
    <aside
      className={cn(
        "flex h-dvh w-full flex-col border-r border-sidebar-border bg-sidebar",
        className,
      )}
    >
      <header className="flex items-center justify-between gap-2 px-3 py-3">
        <SidebarUserButton className="min-w-0 flex-1" />
        <div className="flex items-center gap-0.5">
          <FriendsNavButton />
          <NearbyNavButton />
          <ComposeIconButton />
          <ThemeToggle />
        </div>
      </header>

      <h1 className="px-5 pb-2 text-sm font-semibold text-muted-foreground">
        Messages
      </h1>

      <div className="min-h-0 flex-1">
        <ConversationList />
      </div>
    </aside>
  );
}
