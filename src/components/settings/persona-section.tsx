"use client";

import * as React from "react";
import { Check, Save, Sparkles, WandSparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  useConfirmProfileTags,
  useSubmitProfileStory,
} from "@/hooks/use-profile";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { OwnProfile, ProfileStatus } from "@/lib/types";

const MIN_STORY_LENGTH = 10;
const MAX_STORY_LENGTH = 4000;

const STATUS_LABEL: Record<ProfileStatus, string> = {
  READY: "Ready",
  AWAITING_REVIEW: "Awaiting review",
  PENDING: "Not started",
  SKIPPED: "Skipped",
  FAILED: "Parsing failed",
};

function statusTone(status: ProfileStatus) {
  switch (status) {
    case "READY":
      return "bg-online/15 text-online";
    case "AWAITING_REVIEW":
      return "bg-primary/12 text-primary";
    case "FAILED":
      return "bg-destructive/12 text-destructive";
    default:
      return "bg-secondary text-secondary-foreground";
  }
}

export function PersonaSection({ profile }: { profile: OwnProfile | null }) {
  const submitStory = useSubmitProfileStory();
  const confirmTags = useConfirmProfileTags();

  const [storyDraft, setStoryDraft] = React.useState<string | null>(null);
  const [selectedTags, setSelectedTags] = React.useState<string[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [savedTags, setSavedTags] = React.useState(false);

  const status = profile?.status ?? "PENDING";
  const previewTags = profile?.tags ?? [];
  const story = storyDraft ?? profile?.story ?? "";
  const tagSlugs = selectedTags ?? previewTags.map((tag) => tag.slug);
  const hasTags = previewTags.length > 0;
  // Confirming tags requires a parsed story to exist on the server.
  const canSaveTags = hasTags && status !== "SKIPPED" && status !== "PENDING";

  const tagsDirty =
    selectedTags !== null &&
    (selectedTags.length !== profile?.confirmedTagSlugs.length ||
      selectedTags.some((slug) => !profile?.confirmedTagSlugs.includes(slug)));

  const toggleTag = (slug: string) => {
    setSavedTags(false);
    setSelectedTags((current) => {
      const base = current ?? previewTags.map((tag) => tag.slug);
      return base.includes(slug)
        ? base.filter((item) => item !== slug)
        : [...base, slug];
    });
  };

  async function onAnalyze() {
    const trimmed = story.trim();
    if (trimmed.length < MIN_STORY_LENGTH) {
      setError(`Write at least ${MIN_STORY_LENGTH} characters first.`);
      return;
    }
    setError(null);
    setSavedTags(false);

    try {
      await submitStory.mutateAsync(trimmed);
      // Re-derive selection from the freshly parsed preview tags.
      setSelectedTags(null);
      setStoryDraft(null);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "We couldn’t analyze that story.",
      );
    }
  }

  async function onSaveTags() {
    if (tagSlugs.length === 0) {
      setError("Keep at least one tag selected.");
      return;
    }
    setError(null);

    try {
      await confirmTags.mutateAsync(tagSlugs);
      setSelectedTags(null);
      setSavedTags(true);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "We couldn’t save those tags.",
      );
    }
  }

  return (
    <section className="rounded-3xl border border-border/70 bg-card/85 p-5 shadow-sm sm:p-6">
      <header className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Persona</h2>
          <p className="text-sm text-muted-foreground">
            The story and tags that power friend suggestions.
          </p>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold",
            statusTone(status),
          )}
        >
          {STATUS_LABEL[status]}
        </span>
      </header>

      <div className="space-y-6">
        {profile?.summary && (
          <div className="rounded-2xl bg-secondary px-4 py-3">
            <p className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
              Summary
            </p>
            <p className="mt-2 text-sm leading-6">{profile.summary}</p>
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="persona-story" className="text-sm font-medium">
              Your story
            </label>
            <span className="text-xs font-medium text-muted-foreground">
              {story.trim().length}/{MAX_STORY_LENGTH}
            </span>
          </div>
          <textarea
            id="persona-story"
            value={story}
            onChange={(e) =>
              setStoryDraft(e.target.value.slice(0, MAX_STORY_LENGTH))
            }
            placeholder="Tell us about your hobbies, personality, interests, favorite teams, media, or lifestyle."
            className={cn(
              "min-h-36 w-full resize-y rounded-2xl border border-input bg-background px-4 py-3 text-sm shadow-sm transition-colors",
              "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-ring",
            )}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => void onAnalyze()}
            disabled={submitStory.isPending || confirmTags.isPending}
          >
            {submitStory.isPending ? (
              <Spinner className="size-4 text-current" />
            ) : (
              <WandSparkles className="size-4" />
            )}
            {hasTags ? "Re-analyze story" : "Analyze story"}
          </Button>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium">
            {status === "AWAITING_REVIEW" ? "Suggested tags" : "Your tags"}
          </p>

          {hasTags ? (
            <div className="flex flex-wrap gap-2.5">
              {previewTags.map((tag) => {
                const active = tagSlugs.includes(tag.slug);
                return (
                  <button
                    key={tag.slug}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggleTag(tag.slug)}
                    className={cn(
                      "inline-flex cursor-pointer items-center gap-1.5 rounded-2xl border px-3 py-1.5 text-sm transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background hover:border-primary/40 hover:bg-accent",
                    )}
                  >
                    {tag.label}
                    {active && <Check className="size-3.5 shrink-0" />}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-2xl border border-dashed border-border bg-background/60 px-4 py-4 text-sm text-muted-foreground">
              <Sparkles className="size-4 shrink-0" />
              No tags yet. Write a story above and analyze it to get suggestions.
            </div>
          )}

          {canSaveTags && (
            <div className="flex items-center gap-3">
              <Button
                type="button"
                onClick={() => void onSaveTags()}
                disabled={
                  confirmTags.isPending ||
                  submitStory.isPending ||
                  (status === "READY" && !tagsDirty)
                }
              >
                {confirmTags.isPending ? (
                  <Spinner className="size-4 text-current" />
                ) : (
                  <Save className="size-4" />
                )}
                {status === "AWAITING_REVIEW" ? "Confirm tags" : "Save tags"}
              </Button>
              {savedTags && (
                <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Check className="size-4 text-online" />
                  Saved
                </span>
              )}
            </div>
          )}
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-xl border border-destructive/20 bg-destructive/8 px-4 py-3 text-sm text-destructive"
          >
            {error}
          </p>
        )}
      </div>
    </section>
  );
}
