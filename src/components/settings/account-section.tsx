"use client";

import * as React from "react";
import { Check, ImageOff, Save } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useUpdateMyProfile } from "@/hooks/use-profile";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";
import type { Gender, UpdateProfileInput, User } from "@/lib/types";

const GENDER_OPTIONS: { value: Gender | null; label: string }[] = [
  { value: "M", label: "Male" },
  { value: "F", label: "Female" },
  { value: "T", label: "Other" },
  { value: null, label: "Not set" },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** ISO date string → `YYYY-MM-DD` for <input type="date">. */
function toDateInput(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}

export function AccountSection({ user }: { user: User }) {
  const { setUser } = useAuth();
  const update = useUpdateMyProfile();

  const baseName = user.userName;
  const baseEmail = user.email;
  const baseAvatar = user.profilePictureUrl ?? "";
  const baseGender = user.gender ?? null;
  const baseDob = toDateInput(user.dateOfBirth);

  const [name, setName] = React.useState(baseName);
  const [email, setEmail] = React.useState(baseEmail);
  const [avatar, setAvatar] = React.useState(baseAvatar);
  const [gender, setGender] = React.useState<Gender | null>(baseGender);
  const [dob, setDob] = React.useState(baseDob);

  const [fieldErrors, setFieldErrors] = React.useState<{
    name?: string;
    email?: string;
  }>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState(false);

  // Baselines are derived from the `user` prop on every render, so a successful
  // save (which refreshes the cached user) clears `dirty` without a resync effect.
  const dirty =
    name !== baseName ||
    email !== baseEmail ||
    avatar !== baseAvatar ||
    gender !== baseGender ||
    dob !== baseDob;

  function buildDiff(): UpdateProfileInput {
    const diff: UpdateProfileInput = {};
    if (name !== baseName) diff.userName = name.trim();
    if (email !== baseEmail) diff.email = email.trim();
    if (avatar !== baseAvatar) diff.profilePictureUrl = avatar.trim() || null;
    if (gender !== baseGender) diff.gender = gender;
    if (dob !== baseDob) diff.dateOfBirth = dob || null;
    return diff;
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaved(false);
    setFormError(null);

    const nextErrors: typeof fieldErrors = {};
    if (name.trim().length === 0) nextErrors.name = "Display name can’t be empty.";
    if (email !== baseEmail && !EMAIL_RE.test(email.trim()))
      nextErrors.email = "Enter a valid email address.";
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    try {
      const res = await update.mutateAsync(buildDiff());
      setUser(res.user);
      setSaved(true);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setFieldErrors({ email: "That email is already in use." });
        return;
      }
      setFormError(
        err instanceof ApiError ? err.message : "We couldn’t save your changes.",
      );
    }
  }

  return (
    <section className="rounded-3xl border border-border/70 bg-card/85 p-5 shadow-sm sm:p-6">
      <header className="mb-5">
        <h2 className="text-lg font-semibold">Account</h2>
        <p className="text-sm text-muted-foreground">
          Your basic info, visible to people you connect with.
        </p>
      </header>

      <form onSubmit={onSubmit} className="space-y-5">
        <div className="flex items-center gap-4">
          <Avatar src={avatar || null} name={name} className="size-16" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <label
              htmlFor="account-avatar"
              className="text-sm font-medium"
            >
              Profile photo URL
            </label>
            <div className="flex gap-2">
              <Input
                id="account-avatar"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                placeholder="https://example.com/avatar.jpg"
                inputMode="url"
                autoComplete="off"
              />
              {avatar && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Remove photo"
                  title="Remove photo"
                  onClick={() => setAvatar("")}
                >
                  <ImageOff className="size-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        <Field
          id="account-name"
          label="Display name"
          error={fieldErrors.name}
        >
          <Input
            id="account-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            maxLength={60}
          />
        </Field>

        <Field id="account-email" label="Email" error={fieldErrors.email}>
          <Input
            id="account-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <span className="text-sm font-medium">Gender</span>
            <div
              role="radiogroup"
              aria-label="Gender"
              className="flex flex-wrap gap-1 rounded-lg border border-border p-0.5"
            >
              {GENDER_OPTIONS.map((option) => {
                const active = gender === option.value;
                return (
                  <button
                    key={option.label}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setGender(option.value)}
                    className={cn(
                      "inline-flex h-8 cursor-pointer items-center rounded-md px-3 text-sm font-medium transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          <Field id="account-dob" label="Date of birth">
            <Input
              id="account-dob"
              type="date"
              value={dob}
              max={toDateInput(new Date().toISOString())}
              onChange={(e) => setDob(e.target.value)}
            />
          </Field>
        </div>

        {formError && (
          <p
            role="alert"
            className="rounded-xl border border-destructive/20 bg-destructive/8 px-4 py-3 text-sm text-destructive"
          >
            {formError}
          </p>
        )}

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={!dirty || update.isPending}>
            {update.isPending ? (
              <Spinner className="size-4 text-current" />
            ) : (
              <Save className="size-4" />
            )}
            Save changes
          </Button>
          {saved && !dirty && (
            <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              <Check className="size-4 text-online" />
              Saved
            </span>
          )}
        </div>
      </form>
    </section>
  );
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
