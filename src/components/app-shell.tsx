"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { profileNeedsOnboarding, useMyProfile } from "@/hooks/use-profile";
import { useAuth } from "@/providers/auth-provider";
import { useRealtime } from "@/hooks/use-realtime";
import { Sidebar } from "@/components/chat/sidebar";
import { Spinner } from "@/components/ui/spinner";

/**
 * Shared authenticated shell: sidebar + main content, with the same
 * auth/onboarding guard and realtime subscription the chat/friends layouts use.
 * Bounces unauthenticated users to login and not-yet-onboarded users to the
 * persona flow.
 *
 * Set `requireOnboarded={false}` for screens (e.g. Settings) where the persona
 * is edited inline and may pass through `AWAITING_REVIEW`, so the onboarding
 * guard doesn't yank the user away mid-edit.
 */
export function AppShell({
  children,
  requireOnboarded = true,
}: {
  children: React.ReactNode;
  requireOnboarded?: boolean;
}) {
  const { status, user } = useAuth();
  const router = useRouter();
  const profile = useMyProfile(status === "authenticated" && requireOnboarded);
  const redirectToOnboarding =
    requireOnboarded &&
    status === "authenticated" &&
    profile.isSuccess &&
    profileNeedsOnboarding(profile.data);

  React.useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
    else if (redirectToOnboarding) router.replace("/onboarding/persona");
  }, [status, redirectToOnboarding, router]);

  useRealtime(user?.id);

  const waitingOnProfile =
    requireOnboarded &&
    status === "authenticated" &&
    !profile.isError &&
    !profile.isSuccess;

  if (status !== "authenticated" || waitingOnProfile || redirectToOnboarding) {
    return (
      <div className="flex h-dvh items-center justify-center">
        <Spinner className="size-6" />
      </div>
    );
  }

  return (
    <div className="flex h-dvh overflow-hidden">
      <Sidebar className="hidden w-80 shrink-0 md:flex lg:w-96" />
      <main className="flex min-w-0 flex-1 flex-col">{children}</main>
    </div>
  );
}
