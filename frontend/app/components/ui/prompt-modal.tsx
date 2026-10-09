"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Modal } from "./modal";

interface PromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (value: string) => void;

  /**
   * Optional copy overrides. When omitted, the modal falls back to the
   * translated "create group" wording, so it can be used as-is for the
   * add-group flows.
   */
  title?: string;
  description?: string;
  label?: string;
  placeholder?: string;
  confirmText?: string;
}

/**
 * Generic single-input modal: create a group, kick a member, transfer
 * ownership, or any other flow that asks the user for one line of text.
 */
export function PromptModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  label,
  placeholder,
  confirmText,
}: PromptModalProps) {
  const [value, setValue] = useState("");
  const tModal = useTranslations("modal");
  const tCommon = useTranslations("common");

  const resolvedTitle = title ?? tModal("createGroupTitle");
  const resolvedDescription =
    description ?? tModal("createGroupDescription");
  const resolvedLabel = label ?? tModal("groupName");
  const resolvedPlaceholder =
    placeholder ?? tModal("groupNamePlaceholder");
  const resolvedConfirmText = confirmText ?? tCommon("ok");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedValue = value.trim();
    if (!trimmedValue) {
      return;
    }

    onConfirm(trimmedValue);
    setValue("");
  };

  const handleClose = () => {
    setValue("");
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={resolvedTitle}
      description={resolvedDescription}
      closeLabel={tModal("closeModal")}
    >
      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label
            htmlFor="prompt-modal-input"
            className="mb-2 block font-semibold text-[#3d3461]"
          >
            {resolvedLabel}
          </label>

          <input
            id="prompt-modal-input"
            type="text"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder={resolvedPlaceholder}
            required
            autoFocus
            className="w-full rounded-xl border-2 border-[#b6cfc6] px-4 py-3 text-gray-700 outline-none transition focus:border-[#3d3461]"
          />
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-xl border-2 border-[#b6cfc6] px-6 py-3 font-semibold text-[#3d3461] transition hover:bg-[#eef5f1]"
          >
            {tCommon("cancel")}
          </button>

          <button
            type="submit"
            className="rounded-xl bg-[#3d3461] px-6 py-3 font-semibold text-white transition hover:bg-[#544a85]"
          >
            {resolvedConfirmText}
          </button>
        </div>
      </form>
    </Modal>
  );
}
