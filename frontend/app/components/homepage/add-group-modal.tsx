"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Modal } from "@/app/components/ui/modal";

interface AddGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (groupName: string) => void | Promise<void>;
  error?: string | null;
}

export function AddGroupModal({
  isOpen,
  onClose,
  onCreate,
  error: externalError = null,
}: AddGroupModalProps) {
  const [groupName, setGroupName] = useState("");
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const t = useTranslations("modal");
  const tCommon = useTranslations("common");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!groupName.trim()) {
      return;
    }

    setSubmitting(true);
    setSubmissionError(null);
    try {
      await onCreate(groupName.trim());
      setGroupName("");
    } catch (err) {
      setSubmissionError(
        err instanceof Error ? err.message : tCommon("somethingWentWrong")
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setGroupName("");
    setSubmissionError(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t("createGroupTitle")}
      description={t("createGroupDescription")}
      closeLabel={t("closeModal")}
    >
      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label
            htmlFor="modal-group-name"
            className="mb-2 block font-semibold text-[#3d3461]"
          >
            {t("groupName")}
          </label>

          <input
            id="modal-group-name"
            type="text"
            value={groupName}
            onChange={(event) => setGroupName(event.target.value)}
            placeholder={t("groupNamePlaceholder")}
            required
            autoFocus
            disabled={submitting}
            className="w-full rounded-xl border-2 border-[#b6cfc6] px-4 py-3 text-gray-700 outline-none transition focus:border-[#3d3461] disabled:opacity-60"
          />
        </div>

        {(submissionError || externalError) && (
          <p className="mb-4 text-sm font-semibold text-red-600" role="alert">
            {submissionError || externalError}
          </p>
        )}

        {/* Buttons */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            className="rounded-xl border-2 border-[#b6cfc6] px-6 py-3 font-semibold text-[#3d3461] transition hover:bg-[#eef5f1] disabled:opacity-60"
          >
            {tCommon("cancel")}
          </button>

          <button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-[#3d3461] px-6 py-3 font-semibold text-white transition hover:bg-[#544a85] disabled:opacity-60"
          >
            {t("createGroup")}
          </button>
        </div>
      </form>
    </Modal>
  );
}