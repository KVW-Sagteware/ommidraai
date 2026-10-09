"use client";

import { useTranslations } from "next-intl";
import type { Role } from "./types";

interface GroupActionsProps {
  currentUserRole: Role;
  isLeaving: boolean;
  isKicking: boolean;
  isDeleting: boolean;
  onBack: () => void;
  onOpenUserProperties: () => void;
  onLeave: () => void;
  onOpenInvite: () => void;
  onOpenKick: () => void;
  onOpenDeleteGroup: () => void;
}

export function GroupActions({
  currentUserRole,
  isLeaving,
  isKicking,
  isDeleting,
  onBack,
  onOpenUserProperties,
  onLeave,
  onOpenInvite,
  onOpenKick,
  onOpenDeleteGroup,
}: GroupActionsProps) {
  const t = useTranslations("group");
  const tCommon = useTranslations("common");

  return (
    <section className="mt-8 flex items-center justify-between gap-3 border-t border-gray-200 pt-6">
      {/* BACK BUTTON */}

      <button
        type="button"
        onClick={onBack}
        className="rounded-lg bg-gray-600 px-5 py-3 font-semibold text-white shadow transition hover:bg-gray-700"
      >
        ← {tCommon("back")}
      </button>

      {/* RIGHT SIDE ACTIONS */}

      <div className="flex flex-wrap justify-end gap-3">
        {/* ============================== */}
        {/* MEMBER */}
        {/* ============================== */}

        {(currentUserRole === "guest" || currentUserRole === "member" || currentUserRole === "admin" || currentUserRole === "owner") && (
          <>
            <button
              type="button"
              onClick={onOpenUserProperties}
              className="rounded-lg bg-[#3d3461] px-5 py-3 font-semibold text-white shadow transition hover:bg-[#30294d]"
            >
              {t("updateUserProperties")}
            </button>

            <button
              type="button"
              onClick={onLeave}
              disabled={isLeaving}
              className="rounded-lg bg-[#3d3461] px-5 py-3 font-semibold text-white shadow transition hover:bg-[#30294d] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {tCommon("leave")}
            </button>
          </>
        )}

        {/* ============================== */}
        {/* ADMIN */}
        {/* ============================== */}

        {(currentUserRole === "admin" || currentUserRole === "owner") && (
          <>
            <button
              type="button"
              onClick={onOpenInvite}
              className="rounded-lg bg-green-600/80 px-5 py-3 font-semibold text-white shadow transition hover:bg-green-700"
            >
              {tCommon("invite")}
            </button>

            <button
              type="button"
              onClick={onOpenKick}
              disabled={isKicking}
              className="rounded-lg bg-green-600/80 px-5 py-3 font-semibold text-white shadow transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {tCommon("kick")}
            </button>
          </>
        )}

        {/* ============================== */}
        {/* OWNER */}
        {/* ============================== */}

        {currentUserRole === "owner" && (
          <>
            <button
              type="button"
              onClick={onOpenDeleteGroup}
              disabled={isDeleting}
              className="rounded-lg bg-green-600/80 px-5 py-3 font-semibold text-white shadow transition hover:bg-green-700"
            >
              {t("deleteGroup")}
            </button>
          </>
        )}
      </div>
    </section>
  );
}
