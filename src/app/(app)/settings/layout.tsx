"use client";

import * as React from "react";
import { AppShell } from "@/components/app-shell";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Settings edits the persona inline (which transiently becomes
  // AWAITING_REVIEW), so don't apply the onboarding redirect here.
  return <AppShell requireOnboarded={false}>{children}</AppShell>;
}
