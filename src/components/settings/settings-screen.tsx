"use client";

import Link from "next/link";
import { ArrowLeft, LogOut, UserCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ThemeToggle } from "@/components/theme-toggle";
import { useProfileMe } from "@/hooks/use-profile";
import { useAuth } from "@/providers/auth-provider";
import { AccountSection } from "./account-section";
import { PersonaSection } from "./persona-section";

export function SettingsScreen() {
  const { status, logout } = useAuth();
  const query = useProfileMe(status === "authenticated");

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
          <h1 className="text-base font-semibold">Profile &amp; settings</h1>
        </div>
        <ThemeToggle />
      </header>

      <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-4 pb-10 sm:px-6">
        <div className="mx-auto w-full max-w-2xl space-y-6 py-2">
          {query.isPending ? (
            <Centered icon={<Spinner className="size-6" />} title="Loading your profile…" />
          ) : query.isError ? (
            <Centered
              icon={<UserCog className="size-6" />}
              title="Couldn’t load your profile"
              body={query.error instanceof Error ? query.error.message : undefined}
              action={
                <Button variant="outline" size="sm" onClick={() => void query.refetch()}>
                  Try again
                </Button>
              }
            />
          ) : (
            <>
              <AccountSection user={query.data.user} />
              <PersonaSection profile={query.data.profile} />
            </>
          )}

          {/* Destructive action, kept separate from the editable sections. */}
          <section className="flex flex-col gap-3 rounded-3xl border border-border/70 bg-card/85 p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <h2 className="font-medium">Sign out</h2>
              <p className="text-sm text-muted-foreground">
                You’ll need to log in again to access your account.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => logout()}
              className="text-destructive hover:bg-destructive/10 hover:text-destructive sm:w-auto"
            >
              <LogOut className="size-4" />
              Sign out
            </Button>
          </section>
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
