"use client";

import { useTranslations } from "next-intl";

interface DeleteGroupModalProps {
  isOpen: boolean;
  groupName: string;
  isDeleting: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteGroupModal({
  isOpen,
  groupName,
  isDeleting,
  error,
  onClose,
  onConfirm,
}: DeleteGroupModalProps) {
  const t = useTranslations("group");
  const tCommon = useTranslations("common");

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 px-4"
      onClick={isDeleting ? undefined : onClose}
    >
      {/* Modal box */}
      <div
        className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        {/* ========================================= */}
        {/* HEADER */}
        {/* ========================================= */}

        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-[#3d3461]">
              {t("deleteGroupTitle")}
            </h2>

            <p className="mt-1 text-gray-500">
              {t("deleteGroupDescription", { groupName })}
            </p>
          </div>

          {/* X button */}
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="rounded-xl px-3 py-2 text-xl text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label={tCommon("closeModal")}
          >
            ×
          </button>
        </div>

        {/* ========================================= */}
        {/* BUTTONS */}
        {/* ========================================= */}

        {error && (
          <p className="mb-4 text-sm font-semibold text-red-600" role="alert">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-3">
          {/* Cancel */}
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="rounded-xl border-2 border-[#b6cfc6] px-6 py-3 font-semibold text-[#3d3461] transition hover:bg-[#eef5f1] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {tCommon("cancel")}
          </button>

          {/* Confirm delete */}
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="rounded-xl bg-red-600/80 px-6 py-3 font-semibold text-white shadow transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isDeleting ? tCommon("deleting") : tCommon("delete")}
          </button>
        </div>
      </div>
    </div>
  );
}
