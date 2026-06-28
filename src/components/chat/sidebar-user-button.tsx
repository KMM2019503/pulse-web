"use client";

import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { useAuth } from "@/providers/auth-provider";
import { cn } from "@/lib/utils";

/**
 * Current-user entry point shown top-left of the sidebar / mobile list (in
 * place of the brand logo): avatar + name linking to the Settings screen.
 */
export function SidebarUserButton({ className }: { className?: string }) {
  const { user } = useAuth();

  return (
    <Link
      href="/settings"
      title="Profile & settings"
      aria-label="Profile and settings"
      className={cn(
        "flex min-w-0 items-center gap-2.5 rounded-lg p-1 pr-2.5 transition-colors",
        "hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      <Avatar
        src={user?.profilePictureUrl}
        name={user?.userName}
        className="size-9"
      />
      <span className="truncate text-sm font-semibold">
        {user?.userName ?? "Profile"}
      </span>
    </Link>
  );
}
