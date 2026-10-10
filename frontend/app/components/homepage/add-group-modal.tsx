"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Modal } from "@/app/components/ui/modal";

interface AddGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (groupName: string) => void;
}

export function AddGroupModal({
  isOpen,
  onClose,
  onCreate,
}: AddGroupModalProps) {
  const [groupName, setGroupName] = useState("");
  const t = useTranslations("modal");
  const tCommon = useTranslations("common");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!groupName.trim()) {
      return;
    }

    onCreate(groupName.trim());
    setGroupName("");
  };

  const handleClose = () => {
    setGroupName("");
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
            className="w-full rounded-xl border-2 border-[#b6cfc6] px-4 py-3 text-gray-700 outline-none transition focus:border-[#3d3461]"
          />
        </div>

        {/* Buttons */}
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
            {t("createGroup")}
          </button>
        </div>
      </form>
    </Modal>
  );
}