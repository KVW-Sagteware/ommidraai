"use client";

import { useTranslations } from "next-intl";
import { PromptModal } from "@/app/components/ui/prompt-modal";
import { AddLocationModal } from "./add-location-modal";
import { DeleteGroupModal } from "./delete-group-modal";
import { DeleteLocationModal } from "./delete-location-modal";
import { InviteModal } from "./invite-modal";
import { UpdateUserPropertiesModal } from "./update-user-properties-modal";
import type { GroupData } from "./hooks/use-group-data";
import type { Role } from "./types";

interface GroupModalsProps {
  group: GroupData;
  groupName: string;
  currentUserRole: Role;
}

/**
 * Renders every modal the group page can open: the generic prompt (kick a
 * member / transfer ownership), invites, deleting the group, editing the
 * user's ride properties and adding/removing locations.
 */
export function GroupModals({
  group,
  groupName,
  currentUserRole,
}: GroupModalsProps) {
  const t = useTranslations("group");
  const tCommon = useTranslations("common");

  const { groupId } = group;

  const isCurrentUserPassenger =
    group.users.find((u) => u.user.username === group.currentUsername)
      ?.user_group.is_passenger ?? false;

  const modalSettings = {
    kick: {
      title: t("kickMemberTitle"),
      description: t("kickMemberDescription"),
      label: t("memberName"),
      placeholder: t("memberNamePlaceholder"),
      confirmText: tCommon("kick"),
    },

    "new-owner": {
      title: t("transferOwnershipTitle"),
      description: t("transferOwnershipDescription"),
      label: t("newOwner"),
      placeholder: t("newOwnerPlaceholder"),
      confirmText: tCommon("transfer"),
    },
  };

  function handlePromptConfirm(value: string) {
    if (group.activeModal === "kick") {
      group.kickMember(value);
      return;
    }

    if (group.activeModal === "new-owner") {
      group.transferOwnership(value);
      return;
    }
  }

  const currentModal =
    group.activeModal !== null ? modalSettings[group.activeModal] : null;

  return (
    <>
      {/* ====================================== */}
      {/* GENERIC PROMPT (KICK / TRANSFER) */}
      {/* ====================================== */}

      {currentModal && (
        <PromptModal
          isOpen={group.activeModal !== null}
          onClose={() => group.setActiveModal(null)}
          onConfirm={handlePromptConfirm}
          title={currentModal.title}
          description={currentModal.description}
          label={currentModal.label}
          placeholder={currentModal.placeholder}
          confirmText={currentModal.confirmText}
        />
      )}

      {/* ====================================== */}
      {/* INVITE MODAL */}
      {/* ====================================== */}

      {groupId &&
        group.showInviteModal &&
        (currentUserRole === "owner" || currentUserRole === "admin") && (
          <InviteModal
            isOpen={group.showInviteModal}
            groupId={groupId}
            roles={
              currentUserRole === "owner"
                ? ["admin", "member", "guest"]
                : ["member", "guest"]
            }
            onClose={() => group.setShowInviteModal(false)}
          />
        )}

      {/* ====================================== */}
      {/* DELETE GROUP CONFIRM MODAL */}
      {/* ====================================== */}

      <DeleteGroupModal
        isOpen={group.showDeleteModal}
        groupName={groupName}
        isDeleting={group.isDeleting}
        onClose={() => group.setShowDeleteModal(false)}
        onConfirm={group.deleteGroup}
      />

      <UpdateUserPropertiesModal
        isOpen={group.showUserPropertiesModal}
        carCapacity={
          group.users.find(
            (user) => user.user.username === group.currentUsername
          )?.user_group.car_capacity ?? 0
        }
        isPassenger={isCurrentUserPassenger}
        isSaving={group.isUpdatingUserProperties}
        onClose={() => group.setShowUserPropertiesModal(false)}
        onSave={group.updateUserProperties}
      />

      {/* ====================================== */}
      {/* DELETE LOCATION CONFIRM MODAL */}
      {/* ====================================== */}

      {group.showDeleteLocationModal && group.locationToDelete && (
        <DeleteLocationModal
          isOpen={group.showDeleteLocationModal}
          locationName={group.locationToDelete}
          isDeleting={group.isDeletingLocation}
          onClose={() => {
            group.setShowDeleteLocationModal(false);
            group.setLocationToDelete(null);
          }}
          onConfirm={group.confirmDeleteLocation}
        />
      )}

      {/* ====================================== */}
      {/* ADD LOCATION MODAL */}
      {/* ====================================== */}

      {group.showAddLocationModal && groupId && (
        <AddLocationModal
          groupId={groupId}
          onClose={() => group.setShowAddLocationModal(false)}
          onSuccess={() => {
            group.setShowAddLocationModal(false);
            group.refreshAfterAddLocation();
          }}
        />
      )}
    </>
  );
}
