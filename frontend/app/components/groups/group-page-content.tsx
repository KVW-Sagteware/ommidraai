"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { GroupChat } from "./group-chat";
import { GroupActions } from "./group-actions";
import { GroupHeader } from "./group-header";
import { GroupModals } from "./group-modals";
import { LocationsCard } from "./locations-card";
import { MapCard } from "./map-card";
import { MembersSection } from "./members-section";
import { useGroupData } from "./hooks/use-group-data";
import { useGroupRoutes } from "./hooks/use-group-routes";
import type { Role } from "./types";

interface GroupPageContentProps {
  groupId: string | null;
  groupName: string;
  currentUserRole: Role;
}

export function GroupPageContent({
  groupId,
  groupName,
  currentUserRole,
}: GroupPageContentProps) {
  const t = useTranslations("group");
  const router = useRouter();

  const group = useGroupData({ groupId, groupName, currentUserRole });

  const isCurrentUserPassenger =
    group.users.find((u) => u.user.username === group.currentUsername)
      ?.user_group.is_passenger ?? false;

  const { routes, allRoutes, passengerDriver } = useGroupRoutes({
    algorithm: group.algorithm,
    users: group.users,
    destinations: group.destinations,
    currentUsername: group.currentUsername,
    isCurrentUserPassenger,
  });

  if (group.loading) {
    return (
      <main className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-10">
        <div className="mx-auto max-w-7xl rounded-3xl bg-white p-6 shadow-2xl lg:p-10">
          <p className="text-gray-500">{t("loading")}</p>
        </div>
      </main>
    );
  }

  if (group.fetchError) {
    return (
      <main className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-10">
        <div className="mx-auto max-w-7xl rounded-3xl bg-white p-6 shadow-2xl lg:p-10">
          <p className="text-red-600">{group.fetchError}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-10">
      <div className="mx-auto max-w-7xl rounded-3xl bg-white p-6 shadow-2xl lg:p-10">

        {/* ====================================== */}
        {/* GROUP HEADER */}
        {/* ====================================== */}

        <GroupHeader
          groupName={groupName}
          currentUserRole={currentUserRole}
        />

        {/* ====================================== */}
        {/* LOCATIONS + MAP */}
        {/* ====================================== */}

        <div className="grid gap-8 lg:grid-cols-[250px_1fr]">
          <LocationsCard
            locations={group.locations}
            currentUserRole={currentUserRole}
            isDeletingLocation={group.isDeletingLocation}
            onAddLocation={() => group.setShowAddLocationModal(true)}
            onRemoveLocation={group.removeLocation}
          />

          <MapCard
            routes={routes}
            allRoutes={allRoutes}
            passengerDriver={passengerDriver}
            currentUserRole={currentUserRole}
            selectedAlgorithm={group.selectedAlgorithm}
            availableAlgorithms={group.availableAlgorithms}
            isAlgorithmLoading={group.isAlgorithmLoading}
            onAlgorithmChange={group.handleAlgorithmChange}
          />
        </div>

        {/* ====================================== */}
        {/* MEMBERS */}
        {/* ====================================== */}

        <MembersSection members={group.members} />

        {/* ====================================== */}
        {/* GROUP CHAT */}
        {/* ====================================== */}

        {groupId && (
          <div className="mt-8">
            <GroupChat
              groupId={groupId}
              currentUsername={group.currentUsername}
            />
          </div>
        )}

        {/* ====================================== */}
        {/* BOTTOM ACTIONS */}
        {/* ====================================== */}

        <GroupActions
          currentUserRole={currentUserRole}
          isLeaving={group.isLeaving}
          isKicking={group.isKicking}
          isDeleting={group.isDeleting}
          onBack={() => router.back()}
          onOpenUserProperties={() => group.setShowUserPropertiesModal(true)}
          onLeave={group.leaveGroup}
          onOpenInvite={() => group.setShowInviteModal(true)}
          onOpenKick={() => group.setActiveModal("kick")}
          onOpenDeleteGroup={() => group.setShowDeleteModal(true)}
        />
      </div>

      {/* ====================================== */}
      {/* MODALS */}
      {/* ====================================== */}

      <GroupModals
        group={group}
        groupName={groupName}
        currentUserRole={currentUserRole}
      />
    </main>
  );
}
