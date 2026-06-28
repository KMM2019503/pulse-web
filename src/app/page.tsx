"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useMyProfile, profileNeedsOnboarding } from "@/hooks/use-profile";
import { useAuth } from "@/providers/auth-provider";
import { Spinner } from "@/components/ui/spinner";

export default function RootPage() {
  const { status } = useAuth();
  const router = useRouter();
  const profile = useMyProfile(status === "authenticated");

  React.useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }

    if (status !== "authenticated") {
      return;
    }

    if (profile.isError) {
      router.replace("/chat");
      return;
    }

    if (profile.isSuccess) {
      router.replace(
        profileNeedsOnboarding(profile.data) ? "/onboarding/persona" : "/chat",
      );
    }
  }, [status, profile.isError, profile.isSuccess, profile.data, router]);

  return (
    <div className="flex h-dvh items-center justify-center">
      <Spinner className="size-6" />
    </div>
  );
}
