"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Spinner } from "@/app/components/ui/spinner";

interface JoinGroupFormProps {
  onJoin: (joinCode: string) => Promise<void>;
}

export function JoinGroupForm({ onJoin }: JoinGroupFormProps) {
  const t = useTranslations("home");
  const tCommon = useTranslations("common");
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const joinCode = (new FormData(form).get("joinCode") as string)?.trim();
    if (!joinCode) return;

    setJoining(true);
    setError(null);
    try {
      await onJoin(joinCode);
      form.reset();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : tCommon("somethingWentWrong")
      );
    } finally {
      setJoining(false);
    }
  };

  return (
    <form id="join-group-form" onSubmit={handleSubmit} className="mb-8 flex flex-col gap-4 sm:flex-row">
      <label htmlFor="join-group-code" className="sr-only">
        {t("groupCodeToJoin")}
      </label>

      <input
        id="join-group-code"
        name="joinCode"
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        required
        disabled={joining}
        placeholder={t("groupCodeToJoin")}
        className="text-black flex-1 rounded-xl border-2 border-[#b6cfc6] px-4 py-3 outline-none transition focus:border-[#3d3461] disabled:opacity-60"
      />

      <button
        type="submit"
        disabled={joining}
        className="flex items-center justify-center gap-2 rounded-xl bg-[#a8be8f] px-6 py-3 font-semibold text-[#3d3461] transition hover:bg-[#b6cfc6] disabled:opacity-60"
      >
        {joining && <Spinner className="h-4 w-4 text-[#3d3461]" />}
        {t("joinGroup")}
      </button>
      {error && (
        <p className="text-sm font-semibold text-red-600 sm:basis-full" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}