"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  Check,
  RefreshCw,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import { BrandWordmark } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  profileNeedsOnboarding,
  useConfirmProfileTags,
  useMyProfile,
  useSkipProfile,
  useSubmitProfileStory,
} from "@/hooks/use-profile";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";

const MIN_STORY_LENGTH = 10;
const MAX_STORY_LENGTH = 4000;

export default function PersonaOnboardingPage() {
  const { status } = useAuth();
  const router = useRouter();
  const profileQuery = useMyProfile(status === "authenticated");
  const submitStory = useSubmitProfileStory();
  const confirmTags = useConfirmProfileTags();
  const skipProfile = useSkipProfile();

  const [storyDraft, setStoryDraft] = React.useState<string | null>(null);
  const [selectedTagDraft, setSelectedTagDraft] = React.useState<string[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const profile = profileQuery.data;
  const previewTags = profile?.tags ?? [];
  const story = storyDraft ?? profile?.story ?? "";
  const selectedTagSlugs =
    selectedTagDraft ?? previewTags.map((tag) => tag.slug);
  const isReviewStep = profile?.status === "AWAITING_REVIEW" && previewTags.length > 0;
  const isFailed = profile?.status === "FAILED";

  React.useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  React.useEffect(() => {
    if (!profile) {
      return;
    }

    if (!profileNeedsOnboarding(profile)) {
      router.replace("/chat");
    }
  }, [profile, router]);

  const toggleTag = (slug: string) => {
    setSelectedTagDraft((current) => {
      const base = current ?? previewTags.map((tag) => tag.slug);
      return base.includes(slug)
        ? base.filter((item) => item !== slug)
        : [...base, slug];
    });
  };

  const updateStory = (nextStory: string) => {
    setStoryDraft(nextStory);
    if (profile?.status === "AWAITING_REVIEW") {
      setSelectedTagDraft(null);
    }
  };

  const writeReviewState = (nextProfileStory: string | null, nextTags: string[]) => {
    setStoryDraft(nextProfileStory ?? "");
    setSelectedTagDraft(nextTags);
  };

  const resetReviewState = () => {
    setSelectedTagDraft(null);
    setStoryDraft(profile?.story ?? null);
  };

  const onRetryProfileFetch = async () => {
    resetReviewState();
    await profileQuery.refetch();
  };

  const onAnalyzeStory = async () => {
    const trimmed = story.trim();
    if (trimmed.length < MIN_STORY_LENGTH) {
      setError("Write at least a short story before we analyze it.");
      return;
    }

    setError(null);

    try {
      const response = await submitStory.mutateAsync(trimmed);
      writeReviewState(
        response.profile?.story ?? trimmed,
        response.profile?.tags.map((tag) => tag.slug) ?? [],
      );
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "We couldn't analyze that story.",
      );
    }
  };

  const onConfirmTags = async () => {
    if (selectedTagSlugs.length === 0) {
      setError("Keep at least one tag selected, or skip for now.");
      return;
    }

    setError(null);

    try {
      await confirmTags.mutateAsync(selectedTagSlugs);
      router.replace("/chat");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "We couldn't save those tags.",
      );
    }
  };

  const onSkip = async () => {
    setError(null);

    try {
      await skipProfile.mutateAsync();
      router.replace("/chat");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "We couldn't skip this step.",
      );
    }
  };

  const loadingProfile = status === "authenticated" && profileQuery.isPending;

  if (status !== "authenticated" || loadingProfile) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Spinner className="size-6" />
      </div>
    );
  }

  return (
    <div className="relative min-h-dvh overflow-hidden bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_top,rgba(107,76,230,0.18),transparent_60%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute right-[-10rem] top-28 size-80 rounded-full bg-primary/10 blur-3xl"
      />

      <div className="relative mx-auto flex min-h-dvh max-w-6xl flex-col px-6 py-6">
        <header className="flex items-center justify-between">
          <BrandWordmark />
          <ThemeToggle />
        </header>

        <main className="mx-auto flex w-full max-w-5xl flex-1 items-center py-10">
          <div className="grid w-full gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <section className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-3 py-1 text-xs font-semibold tracking-[0.12em] text-primary uppercase">
                <Sparkles className="size-3.5" />
                Optional onboarding
              </div>

              <div className="space-y-3">
                <h1 className="max-w-xl text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
                  Help Yok understand your vibe.
                </h1>
                <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                  Share a short story about who you are, what you enjoy, and the
                  kind of energy you bring. We’ll turn it into profile tags you can
                  review before anything is saved.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <InfoTile
                  title="Human in control"
                  body="Nothing is final until you confirm the tags."
                />
                <InfoTile
                  title="Fast preview"
                  body="The AI summarizes your story and suggests matching tags."
                />
                <InfoTile
                  title="Skip anytime"
                  body="You can continue to chat now and return later."
                />
              </div>

              <div className="rounded-3xl border border-border/70 bg-card/85 p-5 shadow-sm backdrop-blur">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">Your story</h2>
                    <p className="text-sm text-muted-foreground">
                      A few sentences is enough. Mention hobbies, personality,
                      interests, favorite teams, media, or lifestyle.
                    </p>
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">
                    {story.trim().length}/{MAX_STORY_LENGTH}
                  </span>
                </div>

                <textarea
                  value={story}
                  onChange={(event) =>
                    updateStory(event.target.value.slice(0, MAX_STORY_LENGTH))
                  }
                  placeholder="I build web apps, love football, stay up too late watching horror movies, and I’m the friend who always says yes to weekend trips."
                  className={cn(
                    "min-h-48 w-full resize-y rounded-2xl border border-input bg-background px-4 py-3 text-sm shadow-sm transition-colors",
                    "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-ring",
                  )}
                />

                {isFailed && (
                  <div className="mt-3 rounded-2xl border border-destructive/20 bg-destructive/8 px-4 py-3 text-sm text-destructive">
                    We couldn&apos;t parse the previous version of your story. You can
                    edit it and try again, or skip this step for now.
                  </div>
                )}

                {profileQuery.isError && (
                  <div className="mt-3 flex flex-col gap-3 rounded-2xl border border-border/70 bg-secondary/70 px-4 py-3 text-sm text-secondary-foreground sm:flex-row sm:items-center sm:justify-between">
                    <p>
                      We couldn&apos;t load your saved onboarding progress. You can
                      still continue from here, or retry the fetch first.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => void onRetryProfileFetch()}
                    >
                      <RefreshCw className="size-4" />
                      Retry
                    </Button>
                  </div>
                )}

                {error && (
                  <div className="mt-3 rounded-2xl border border-destructive/20 bg-destructive/8 px-4 py-3 text-sm text-destructive">
                    {error}
                  </div>
                )}

                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <Button
                    type="button"
                    onClick={() => void onAnalyzeStory()}
                    disabled={submitStory.isPending || skipProfile.isPending}
                    className="sm:min-w-44"
                  >
                    {submitStory.isPending ? (
                      <Spinner className="size-4 text-current" />
                    ) : (
                      <WandSparkles className="size-4" />
                    )}
                    {isReviewStep ? "Analyze again" : "Analyze my story"}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void onSkip()}
                    disabled={submitStory.isPending || confirmTags.isPending || skipProfile.isPending}
                  >
                    {skipProfile.isPending ? (
                      <Spinner className="size-4 text-current" />
                    ) : null}
                    Skip for now
                  </Button>
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] border border-border/70 bg-card/85 p-6 shadow-sm backdrop-blur">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Tag preview</h2>
                  <p className="text-sm text-muted-foreground">
                    Review the suggestions and keep the ones that feel right.
                  </p>
                </div>
                {profile?.parsedAt && (
                  <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
                    Ready to review
                  </span>
                )}
              </div>

              {!isReviewStep ? (
                <EmptyPreview />
              ) : (
                <div className="space-y-5">
                  {profile?.summary && (
                    <div className="rounded-2xl bg-secondary px-4 py-3">
                      <p className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                        Summary
                      </p>
                      <p className="mt-2 text-sm leading-6">{profile.summary}</p>
                    </div>
                  )}

                  <div>
                    <p className="mb-3 text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                      Suggested tags
                    </p>
                    <div className="flex flex-wrap gap-2.5">
                      {previewTags.map((tag) => {
                        const active = selectedTagSlugs.includes(tag.slug);
                        return (
                          <button
                            key={tag.slug}
                            type="button"
                            onClick={() => toggleTag(tag.slug)}
                            className={cn(
                              "group inline-flex cursor-pointer items-center gap-2 rounded-2xl border px-3 py-2 text-left transition-colors",
                              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                              active
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border bg-background hover:border-primary/40 hover:bg-accent",
                            )}
                          >
                            <span className="flex flex-col">
                              <span className="text-sm font-medium">{tag.label}</span>
                              <span
                                className={cn(
                                  "text-[11px] uppercase tracking-[0.12em]",
                                  active
                                    ? "text-primary-foreground/75"
                                    : "text-muted-foreground",
                                )}
                              >
                                {tag.category.replace("-", " ")}
                              </span>
                            </span>
                            {active && <Check className="size-4 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {profile?.suggestedTags.length ? (
                    <div className="rounded-2xl border border-dashed border-border px-4 py-3">
                      <p className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                        Heard, but not in our current vocabulary
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {profile.suggestedTags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-secondary px-2.5 py-1 text-xs text-secondary-foreground"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div className="rounded-2xl border border-border bg-background/70 px-4 py-3 text-sm text-muted-foreground">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="mt-0.5 size-4 shrink-0" />
                      <p>
                        Deselect anything that doesn&apos;t fit. You can always skip
                        this step if you don&apos;t want to save tags right now.
                      </p>
                    </div>
                  </div>

                  <Button
                    type="button"
                    onClick={() => void onConfirmTags()}
                    disabled={
                      confirmTags.isPending ||
                      submitStory.isPending ||
                      skipProfile.isPending
                    }
                    className="w-full"
                  >
                    {confirmTags.isPending ? (
                      <Spinner className="size-4 text-current" />
                    ) : (
                      <ArrowRight className="size-4" />
                    )}
                    Confirm and continue
                  </Button>
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

function InfoTile({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card/70 p-4 shadow-sm">
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">{body}</p>
    </div>
  );
}

function EmptyPreview() {
  return (
    <div className="flex min-h-80 flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-background/60 px-6 text-center">
      <div className="rounded-2xl bg-primary/10 p-3 text-primary">
        <Sparkles className="size-6" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">Your preview will show up here</h3>
      <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
        Once we analyze your story, you&apos;ll be able to review the summary and
        decide which tags should be saved to your profile.
      </p>
      <div className="mt-4 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
        Optional step
      </div>
    </div>
  );
}
