"use client";

import { useCallback, useMemo, useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { AddGroupModal } from "@/app/components/homepage/model/add-model";
import { DeleteGroupModal } from "@/app/components/groups/delete-group-modal";
import { DeleteLocationModal } from "@/app/components/groups/delete-location-modal";
import { AddLocationModal } from "@/app/components/groups/add-location-modal";
import { InviteModal } from "@/app/components/groups/invite-modal";
import { UpdateUserPropertiesModal } from "@/app/components/groups/update-user-properties-modal";
import { WorldMap } from "@/app/components/groups/world-map";
import { GroupChat } from "@/app/components/groups/group-chat";
import { TrashIcon } from "lucide-react";

type Role = "owner" | "admin" | "member" | "guest";

type GroupMember = {
  name: string;
  role: Role;
};

type ModalType =
  | "kick"
  | "new-owner"
  | null;

type ApiUser = {
  user: { username: string; email: string };
  user_group: { is_passenger: boolean; car_capacity: number, role: Role };
  location: { latitude: number; longitude: number };
};

type ApiDestination = {
  group_location: { display_name: string };
  location: { latitude: number; longitude: number };
};

type ApiAlgorithmRoute = {
  distance: number;
  geometry: string;
  path: string[];
};

type ApiAlgorithmEntry = {
  destination: string;
  bottleneck: number;
  routes: Record<string, ApiAlgorithmRoute>;
};

type ApiAlgorithmOption = {
  id: string;
  name: string;
};

type ApiGroupData = {
  users: ApiUser[];
  destinations: ApiDestination[];
  algorithm: ApiAlgorithmEntry[] | string;
  algorithm_name?: string;
  available_algorithms?: ApiAlgorithmOption[];
};

type ApiMeResponse = {
  username: string;
  email: string;
};

type WorldMapPoint = {
  label: string;
  latitude: number;
  longitude: number;
};

type WorldMapRouteInput = {
  id: string;
  driver: string;
  ranking: number;
  destination: string;
  distance: number | null;
  geometry: string | null;
  points: WorldMapPoint[];
};

// Default routing algorithm used when the group data endpoint is first loaded.
const DEFAULT_ALGORITHM = "greedy";

// Resolves every node along an algorithm path (users by username, destinations
// by display name) into map pins, dropping any node that cannot be found.
function resolvePathNodes(
  path: string[],
  users: ApiUser[],
  destinations: ApiDestination[]
): WorldMapPoint[] {
  return path
    .map((name) => {
      const userNode = users.find((user) => user.user.username === name);

      if (userNode) {
        return {
          label: userNode.user.username,
          latitude: userNode.location.latitude,
          longitude: userNode.location.longitude,
        };
      }

      const destNode = destinations.find(
        (destination) => destination.group_location.display_name === name
      );

      if (destNode) {
        return {
          label: destNode.group_location.display_name,
          latitude: destNode.location.latitude,
          longitude: destNode.location.longitude,
        };
      }

      return null;
    })
    .filter((point): point is WorldMapPoint => point !== null);
}

export default function GroupPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("group");
  const tCommon = useTranslations("common");

  const groupName = decodeURIComponent(
    Array.isArray(params.groupName)
      ? params.groupName[0]
      : params.groupName || "Group"
  );

  const groupId = searchParams.get("groupId");
  const roleParam = searchParams.get("role") as Role | null;
  const currentUserRole: Role = roleParam ?? "member";

  const [members, setMembers] = useState<GroupMember[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [destinations, setDestinations] = useState<ApiDestination[]>([]);
  const [algorithm, setAlgorithm] = useState<ApiAlgorithmEntry[] | null>(null);
  const [currentUsername, setCurrentUsername] = useState("");
  const [loading, setLoading] = useState(!!groupId);
  const [fetchError, setFetchError] = useState<string | null>(
    groupId ? null : t("missingGroupId")
  );

  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showAddLocationModal, setShowAddLocationModal] = useState(false);
  const [showUserPropertiesModal, setShowUserPropertiesModal] = useState(false);
  const [isUpdatingUserProperties, setIsUpdatingUserProperties] = useState(false);
  const [showDeleteLocationModal, setShowDeleteLocationModal] = useState(false);
  const [locationToDelete, setLocationToDelete] = useState<string | null>(null);
  const [isDeletingLocation, setIsDeletingLocation] = useState(false);
  const [selectedAlgorithm, setSelectedAlgorithm] =
    useState<string>(DEFAULT_ALGORITHM);
  const [availableAlgorithms, setAvailableAlgorithms] = useState<
    ApiAlgorithmOption[]
  >([]);
  const [isAlgorithmLoading, setIsAlgorithmLoading] = useState(false);
  const [isKicking, setIsKicking] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [showActionsPanel, setShowActionsPanel] = useState(false);

  // Loads the current user and the full group dataset (users, destinations,
  // routing output). Throws on failure so each caller can decide how to surface
  // the error — the initial load shows the full-page error state, while
  // user-triggered reloads (algorithm switch, adding a location) alert instead.
  const loadGroupData = useCallback(
    async (algorithmName: string) => {
      if (!groupId) return;

      const meResponse = await fetch(`/api/backend/auth/me`);
      if (!meResponse.ok) {
        throw new Error("Failed to fetch current user");
      }
      const meData = (await meResponse.json()) as ApiMeResponse;
      const username = meData.username;
      setCurrentUsername(username);

      const groupResponse = await fetch(
        `/api/backend/groups/${groupId}?algorithm=${algorithmName}`
      );
      if (!groupResponse.ok) {
        throw new Error(
          `Failed to fetch group data (status ${groupResponse.status})`
        );
      }
      const groupData = (await groupResponse.json()) as ApiGroupData;

      const apiMembers: GroupMember[] = groupData.users.map((u) => ({
        name: u.user.username,
        role: u.user_group.role,
      }));

      setMembers(apiMembers);
      setUsers(groupData.users);
      setDestinations(groupData.destinations);
      setAlgorithm(
        Array.isArray(groupData.algorithm) ? groupData.algorithm : []
      );

      const apiLocations = groupData.destinations.map(
        (d) => d.group_location.display_name
      );

      setLocations(apiLocations);

      if (typeof groupData.algorithm_name === "string") {
        setSelectedAlgorithm(groupData.algorithm_name);
      }

      if (Array.isArray(groupData.available_algorithms)) {
        setAvailableAlgorithms(groupData.available_algorithms);
      }
    },
    [groupId]
  );

  useEffect(() => {
    if (!groupId) {
      return;
    }

    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      setFetchError(null);

      try {
        await loadGroupData(DEFAULT_ALGORITHM);
      } catch (err) {
        if (!cancelled) {
          setFetchError(
            err instanceof Error
              ? err.message
              : tCommon("somethingWentWrong")
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [groupId, loadGroupData, tCommon]);

  async function kickMember(name: string) {
    const trimmedName = name.trim();

    if (!trimmedName) {
      return;
    }

    const member = members.find(
      (item) =>
        item.name.toLowerCase() ===
        trimmedName.toLowerCase()
    );

    if (!member) {
      alert(t("memberNotFound"));
      return;
    }

    if (member.role === "owner") {
      alert(t("ownerCannotBeKicked"));
      return;
    }

    if (!groupId || isKicking) return;

    setIsKicking(true);

    try {
      const response = await fetch(
        `/api/backend/groups/${groupId}/user/${encodeURIComponent(trimmedName)}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(
          data?.detail || tCommon("somethingWentWrong")
        );
      }

      setMembers((prev) =>
        prev.filter(
          (item) =>
            item.name.toLowerCase() !==
            trimmedName.toLowerCase()
        )
      );

      setActiveModal(null);
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : tCommon("somethingWentWrong")
      );
    } finally {
      setIsKicking(false);
    }
  }

  function transferOwnership(newOwnerName: string) {
    const trimmedName = newOwnerName.trim();

    if (!trimmedName) {
      return;
    }

    const admin = members.find(
      (member) =>
        member.name.toLowerCase() ===
          trimmedName.toLowerCase() &&
        member.role === "admin"
    );

    if (!admin) {
      alert(
        t("enterExistingAdmin")
      );
      return;
    }

    setMembers((prev) =>
      prev.map((member) => {
        if (member.role === "owner") {
          return {
            ...member,
            role: "admin",
          };
        }

        if (
          member.name.toLowerCase() ===
          admin.name.toLowerCase()
        ) {
          return {
            ...member,
            role: "owner",
          };
        }

        return member;
      })
    );

    setActiveModal(null);
  }

  const leaveGroup = useCallback(async () => {
    if (currentUserRole === "owner") {
      setActiveModal("new-owner");
      return;
    }

    if (!groupId || isLeaving) return;

    setIsLeaving(true);

    try {
      const response = await fetch(
        `/api/backend/groups/${groupId}/leave`,
        { method: "POST" }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(
          data?.detail || tCommon("somethingWentWrong")
        );
      }

      router.push("/");
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : tCommon("somethingWentWrong")
      );
    } finally {
      setIsLeaving(false);
    }
  }, [currentUserRole, groupId, isLeaving, router, tCommon]);

  async function deleteGroup() {
    if (!groupId || isDeleting) return;

    setIsDeleting(true);

    try {
      const response = await fetch(
        `/api/backend/groups/${groupId}/delete?group_name=${encodeURIComponent(groupName)}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(
          data?.detail || tCommon("somethingWentWrong")
        );
      }

      setShowDeleteModal(false);
      router.push("/");
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : tCommon("somethingWentWrong")
      );
    } finally {
      setIsDeleting(false);
    }
  }

  const ownerMembers = members.filter(
    (member) => member.role === "owner"
  );

  // Refetch the group data with a different routing algorithm and refresh the
  // world map. The owner can switch between the algorithms the backend offers.
  async function handleAlgorithmChange(algorithmName: string) {
    if (!groupId || algorithmName === selectedAlgorithm) return;

    setIsAlgorithmLoading(true);

    try {
      await loadGroupData(algorithmName);
    } catch (err) {
      alert(
        err instanceof Error ? err.message : tCommon("somethingWentWrong")
      );
    } finally {
      setIsAlgorithmLoading(false);
    }
  }

  // Re-fetches the group data after a location was added so the locations
  // section and the map show the new destination.
  async function refreshAfterAddLocation() {
    try {
      await loadGroupData(selectedAlgorithm);
    } catch (err) {
      alert(
        err instanceof Error ? err.message : tCommon("somethingWentWrong")
      );
    }
  }

  async function updateUserProperties(
    carCapacity: number,
    isPassenger: boolean
  ) {
    if (!groupId || isUpdatingUserProperties) return;

    setIsUpdatingUserProperties(true);

    try {
      const query = new URLSearchParams({
        car_capacity: String(carCapacity),
        is_passenger: String(isPassenger),
      });
      const response = await fetch(
        `/api/backend/groups/${groupId}/user/properties?${query.toString()}`,
        { method: "PUT" }
      );

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.detail || tCommon("somethingWentWrong"));
      }

      setShowUserPropertiesModal(false);
      await loadGroupData(selectedAlgorithm);
    } finally {
      setIsUpdatingUserProperties(false);
    }
  }

  // Opens the confirmation modal for removing a location from the group.
  function removeLocation(locationName: string) {
    setLocationToDelete(locationName);
    setShowDeleteLocationModal(true);
  }

  // Removes a destination from the group, then re-fetches the group data
  // so the locations list and the world map no longer show the deleted
  // location.
  async function confirmDeleteLocation() {
    if (!groupId || !locationToDelete || isDeletingLocation) return;

    setIsDeletingLocation(true);

    try {
      const response = await fetch(
        `/api/backend/groups/${groupId}/location/delete?location_name=${encodeURIComponent(locationToDelete)}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(
          data?.detail || tCommon("somethingWentWrong")
        );
      }

      setShowDeleteLocationModal(false);
      setLocationToDelete(null);
      await refreshAfterAddLocation();
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : tCommon("somethingWentWrong")
      );
    } finally {
      setIsDeletingLocation(false);
    }
  }

  const adminMembers = members.filter(
    (member) => member.role === "admin"
  );

  const normalMembers = members.filter(
    (member) => member.role === "member"
  );

  const guestMembers = members.filter(
    (member) => member.role === "guest"
  );

  // Whether the current user is a passenger who will be picked up by a driver.
  const isCurrentUserPassenger =
    users.find((u) => u.user.username === currentUsername)?.user_group
      .is_passenger ?? false;

  // Collect the destinations this user can drive to. The algorithm response
  // already ranks every destination from best to worst, so the entry index
  // (+1) becomes the ranking number shown in the dropdown. Only routes whose
  // starting node is the current user are usable by them, and each route
  // carries every node along the path (start, any passengers, destination)
  // so the map can drop a pin for each one.
  const routes = useMemo(() => {
    if (!algorithm || algorithm.length === 0) {
      return [];
    }

    const resultRoutes: WorldMapRouteInput[] = [];

    algorithm.forEach((entry, index) => {
      // Drivers use their own route. A passenger has no route keyed by them,
      // so they ride along with the driver whose path includes them — this
      // still lets the map draw the journey they will be taken on.
      let driverRoute = entry.routes[currentUsername];
      let driverName = currentUsername;

      if (!driverRoute || driverRoute.path?.[0] !== currentUsername) {
        const ridingRoute = Object.entries(entry.routes).find(
          ([name, route]) =>
            name !== currentUsername &&
            (route.path || []).includes(currentUsername)
        );

        if (!ridingRoute) {
        return;
      }

        [driverName, driverRoute] = ridingRoute;
      }

      const path = driverRoute.path || [];

      resultRoutes.push({
        id: entry.destination,
        driver: driverName,
        ranking: index + 1,
        destination: entry.destination,
        distance: driverRoute.distance ?? null,
        geometry: driverRoute.geometry ?? null,
        points: resolvePathNodes(path, users, destinations),
      });
    });

    return resultRoutes;
  }, [algorithm, users, destinations, currentUsername]);

  // Every driver's route to every destination, used by the owner's
  // "show all routes" toggle. The map groups these per destination so all
  // drivers heading to the same place are drawn together.
  const allRoutes = useMemo(() => {
    if (!algorithm || algorithm.length === 0) {
      return [];
    }

    const resultRoutes: WorldMapRouteInput[] = [];

    algorithm.forEach((entry, index) => {
      Object.entries(entry.routes).forEach(([driverName, driverRoute]) => {
        resultRoutes.push({
          id: `${entry.destination}-${driverName}`,
          driver: driverName,
          ranking: index + 1,
          destination: entry.destination,
          distance: driverRoute.distance ?? null,
          geometry: driverRoute.geometry ?? null,
          points: resolvePathNodes(driverRoute.path || [], users, destinations),
        });
      });
    });

    return resultRoutes;
  }, [algorithm, users, destinations]);

  // When the current user is a passenger, find the driver (the start node of
  // the route containing them) who will pick them up.
  const passengerDriver = useMemo(() => {
    if (!isCurrentUserPassenger || !algorithm) {
      return null;
    }

    for (const entry of algorithm) {
      for (const route of Object.values(entry.routes)) {
        const path = route.path || [];

        if (
          path.includes(currentUsername) &&
          path[0] !== currentUsername
        ) {
          return path[0];
        }
      }
    }

    return null;
  }, [algorithm, currentUsername, isCurrentUserPassenger]);

  const modalSettings = {
    kick: {
      title: t("kickMemberTitle"),
      description:
        t("kickMemberDescription"),
      label: t("memberName"),
      placeholder: t("memberNamePlaceholder"),
      confirmText: tCommon("kick"),
    },

    "new-owner": {
      title: t("transferOwnershipTitle"),
      description:
        t("transferOwnershipDescription"),
      label: t("newOwner"),
      placeholder: t("newOwnerPlaceholder"),
      confirmText: tCommon("transfer"),
    },
  };

  function handleModalCreate(value: string) {
    if (activeModal === "kick") {
      kickMember(value);
      return;
    }

    if (activeModal === "new-owner") {
      transferOwnership(value);
      return;
    }
  }

  const currentModal =
    activeModal !== null
      ? modalSettings[activeModal]
      : null;

  const actionItems = useMemo(
    () => {
      const items: Array<{
        label: string;
        action: () => void;
        variant: "primary" | "secondary";
        disabled?: boolean;
      }> = [];

      if (
        currentUserRole === "guest" ||
        currentUserRole === "member" ||
        currentUserRole === "admin" ||
        currentUserRole === "owner"
      ) {
        items.push({
          label: t("updateUserProperties"),
          action: () => setShowUserPropertiesModal(true),
          variant: "primary",
        });

        items.push({
          label: tCommon("leave"),
          action: leaveGroup,
          variant: "primary",
          disabled: isLeaving,
        });
      }

      if (currentUserRole === "admin" || currentUserRole === "owner") {
        items.push({
          label: tCommon("invite"),
          action: () => setShowInviteModal(true),
          variant: "secondary",
        });

        items.push({
          label: tCommon("kick"),
          action: () => setActiveModal("kick"),
          variant: "secondary",
          disabled: isKicking,
        });
      }

      if (currentUserRole === "owner") {
        items.push({
          label: t("deleteGroup"),
          action: () => setShowDeleteModal(true),
          variant: "secondary",
          disabled: isDeleting,
        });
      }

      return items;
    },
    [currentUserRole, isDeleting, isKicking, isLeaving, leaveGroup, t, tCommon]
  );

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-10">
        <div className="mx-auto max-w-7xl rounded-3xl bg-white p-6 shadow-2xl lg:p-10">
          <p className="text-gray-500">{t("loading")}</p>
        </div>
      </main>
    );
  }

  if (fetchError) {
    return (
      <main className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-10">
        <div className="mx-auto max-w-7xl rounded-3xl bg-white p-6 shadow-2xl lg:p-10">
          <p className="text-red-600">{fetchError}</p>
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

        <header className="mb-8 border-b border-gray-200 pb-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
                {groupName}
              </h1>

              <p className="mt-2 text-gray-500">
                {t("welcome", { groupName })}
              </p>

              <div className="mt-3">
                <span className="rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-green-700">
                  {t("yourRole", { role: currentUserRole })}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* ====================================== */}
        {/* LOCATIONS + MAP */}
        {/* ====================================== */}

        <div className="grid gap-8 lg:grid-cols-[250px_1fr]">

          {/* ---------------------------------- */}
          {/* LOCATIONS */}
          {/* ---------------------------------- */}

          <section className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {t("locations")}
              </h2>

              {currentUserRole !== "guest" && (
                <button
                  type="button"
                  onClick={() =>
                    setShowAddLocationModal(true)
                  }
                  className="rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow transition hover:bg-green-700"
                >
                  +
                </button>
              )}
            </div>

            {locations.length === 0 ? (
              <p className="text-sm text-gray-500">
                {t("noLocations")}
              </p>
            ) : (
              <ul className="space-y-3">
                {locations.map(
                  (location, index) => (
                    <li
                      key={`${location}-${index}`}
                      className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm"
                    >
                      <span className="text-gray-700">{location}</span>
                      {currentUserRole !== "member" && (
                        <button
                          type="button"
                          onClick={() => removeLocation(location)}
                          disabled={isDeletingLocation}
                          className="rounded-md p-1 text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                          aria-label={t("deleteLocation", { location })}
                        >
                          <TrashIcon/>
                        </button>
                      )}
                    </li>
                  )
                )}
              </ul>
            )}
          </section>

          {/* ---------------------------------- */}
          {/* WORLD MAP */}
          {/* ---------------------------------- */}

          <section className="overflow-hidden rounded-2xl border border-gray-300">
            {availableAlgorithms.length > 0 && (
              <div className="flex items-center justify-end gap-3 border-b border-gray-200 bg-gray-50 px-4 py-3">
                <label
                  htmlFor="algorithm-select"
                  className="text-sm font-semibold text-gray-600"
                >
                  {t("algorithm")}
                </label>

                <select
                  id="algorithm-select"
                  value={selectedAlgorithm}
                  onChange={(event) => handleAlgorithmChange(event.target.value)}
                  disabled={isAlgorithmLoading}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm outline-none transition focus:border-[#3d3461] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {availableAlgorithms.map((algo) => (
                    <option key={algo.id} value={algo.id}>
                      {algo.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="relative">
              <WorldMap
                routes={routes}
                allRoutes={allRoutes}
                passengerDriver={passengerDriver}
                isAdmin={currentUserRole === "owner" || currentUserRole === "admin"}
              />

              {isAlgorithmLoading && (
                <div className="absolute inset-0 z-[1001] flex items-center justify-center bg-gray-100/70">
                  <div className="flex items-center gap-3 rounded-xl bg-white px-5 py-4 shadow-lg">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-[#3d3461]" />
                    <span className="text-sm font-semibold text-gray-700">
                      {t("algorithmLoading")}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* ====================================== */}
        {/* MEMBERS */}
        {/* ====================================== */}

        <section className="mt-8 rounded-2xl border border-gray-200 bg-gray-50 p-6">

          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">
              {t("members")}
            </h2>

            <span className="rounded-full bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700">
              {t("memberCount", { count: members.length })}
            </span>
          </div>

          {/* ---------------------------------- */}
          {/* OWNER */}
          {/* ---------------------------------- */}

          <div className="mb-6">
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-green-700">
              {t("owner")}
            </h3>

            <div className="space-y-2">
              {ownerMembers.map(
                (member) => (
                  <div
                    key={member.name}
                    className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 p-4"
                  >
                    <span className="font-semibold text-gray-900">
                      {member.name}
                    </span>

                    <span className="rounded-full bg-green-600 px-3 py-1 text-xs font-bold text-white">
                      {t("owner")}
                    </span>
                  </div>
                )
              )}
            </div>
          </div>

          {/* ---------------------------------- */}
          {/* ADMINS */}
          {/* ---------------------------------- */}

          <div className="mb-6">
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-blue-700">
              {t("admins")}
            </h3>

            <div className="space-y-2">
              {adminMembers.length === 0 ? (
                <p className="text-sm text-gray-500">
                  {t("noAdmins")}
                </p>
              ) : (
                adminMembers.map(
                  (member) => (
                    <div
                      key={member.name}
                      className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 p-4"
                    >
                      <span className="font-semibold text-gray-900">
                        {member.name}
                      </span>

                      <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-bold text-white">
                      {t("adminBadge")}
                    </span>
                    </div>
                  )
                )
              )}
            </div>
          </div>

          {/* ---------------------------------- */}
          {/* MEMBERS */}
          {/* ---------------------------------- */}

          <div className="mb-6">
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-600">
              {t("members")}
            </h3>

            <div className="space-y-2">
              {normalMembers.length === 0 ? (
                <p className="text-sm text-gray-500">
                  {t("noMembers")}
                </p>
              ) : (
                normalMembers.map(
                  (member) => (
                    <div
                      key={member.name}
                      className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4"
                    >
                      <span className="font-semibold text-gray-900">
                        {member.name}
                      </span>

                      <span className="rounded-full bg-gray-300 px-3 py-1 text-xs font-bold text-gray-700">
                        {t("memberBadge")}
                      </span>
                    </div>
                  )
                )
              )}
            </div>
          </div>

          {/* ---------------------------------- */}
          {/* GUESTS */}
          {/* ---------------------------------- */}

          <div>
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-600">
              {t("guests")}
            </h3>

            <div className="space-y-2">
              {guestMembers.length === 0 ? (
                <p className="text-sm text-gray-500">
                  {t("noGuests")}
                </p>
              ) : (
                guestMembers.map(
                  (member) => (
                    <div
                      key={member.name}
                      className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4"
                    >
                      <span className="font-semibold text-gray-900">
                        {member.name}
                      </span>

                      <span className="rounded-full bg-gray-300 px-3 py-1 text-xs font-bold text-gray-700">
                        {t("guestBadge")}
                      </span>
                    </div>
                  )
                )
              )}
            </div>
          </div>
        </section>

        <section className="mt-8 flex items-start justify-between gap-4 border-t border-gray-200 pt-6">
        {/* ====================================== */}
        {/* GROUP CHAT */}
        {/* ====================================== */}

        {groupId && (
          <div className="mt-8">
            <GroupChat groupId={groupId} currentUsername={currentUsername} />
          </div>
        )}
        </section>

        {/* ====================================== */}
        {/* BOTTOM ACTIONS */}
        {/* ====================================== */}

        <section className="mt-8 flex items-center justify-between gap-3 border-t border-gray-200 pt-6">

          {/* BACK BUTTON */}

          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg bg-gray-600 px-5 py-3 font-semibold text-white shadow transition hover:bg-gray-700"
          >
            ← {tCommon("back")}
          </button>

          <div className="flex w-full max-w-[560px] flex-col items-end">
            <button
              type="button"
              aria-expanded={showActionsPanel}
              aria-controls="group-action-panel"
              onClick={() => setShowActionsPanel((visible) => !visible)}
              className="w-full rounded-2xl bg-[#403568] px-6 py-3 text-2xl font-bold text-white shadow-md transition hover:bg-[#342b55] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#403568]/25 active:scale-[0.98]"
            >
              Actions
            </button>

            {showActionsPanel && (
              <div
                id="group-action-panel"
                className="mt-5 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                <div className="w-full">
                  {actionItems.map((item, index) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={item.action}
                      disabled={item.disabled}
                      className={`flex w-full items-center justify-between border-b border-slate-200 px-5 py-4 text-left text-[1.05rem] font-semibold transition last:border-b-0 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-emerald-200 disabled:cursor-not-allowed disabled:opacity-50 ${
                        item.variant === "primary"
                          ? "bg-[#403568] text-white hover:bg-[#342b55]"
                          : "bg-[#31b566] text-white hover:bg-[#2aa35a]"
                      } ${index === actionItems.length - 1 ? "border-b-0" : ""}`}
                    >
                      <span>{item.label}</span>
                      <span aria-hidden="true" className="text-2xl leading-none">
                        ›
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

      </div>

      {/* ====================================== */}
      {/* SHARED ADD MODEL */}
      {/* ====================================== */}

      {currentModal && (
        <AddGroupModal
          isOpen={activeModal !== null}
          onClose={() => setActiveModal(null)}
          onCreate={handleModalCreate}
          title={currentModal.title}
          description={currentModal.description}
          label={currentModal.label}
          placeholder={currentModal.placeholder}
          confirmText={currentModal.confirmText}
        />
      )}

      {groupId && (currentUserRole === "owner" || currentUserRole === "admin") && (
        <InviteModal
          isOpen={showInviteModal}
          groupId={groupId}
          roles={currentUserRole === "owner" ? ["admin", "member", "guest"] : ["member", "guest"]}
          onClose={() => setShowInviteModal(false)}
        />
      )}

      {/* ====================================== */}
      {/* DELETE GROUP CONFIRM MODAL */}
      {/* ====================================== */}

      <DeleteGroupModal
        isOpen={showDeleteModal}
        groupName={groupName}
        isDeleting={isDeleting}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={deleteGroup}
      />

      <UpdateUserPropertiesModal
        isOpen={showUserPropertiesModal}
        carCapacity={
          users.find((user) => user.user.username === currentUsername)
            ?.user_group.car_capacity ?? 0
        }
        isPassenger={isCurrentUserPassenger}
        isSaving={isUpdatingUserProperties}
        onClose={() => setShowUserPropertiesModal(false)}
        onSave={updateUserProperties}
      />

      {/* ====================================== */}
      {/* DELETE LOCATION CONFIRM MODAL */}
      {/* ====================================== */}

      {showDeleteLocationModal && locationToDelete && (
        <DeleteLocationModal
          isOpen={showDeleteLocationModal}
          locationName={locationToDelete}
          isDeleting={isDeletingLocation}
          onClose={() => {
            setShowDeleteLocationModal(false);
            setLocationToDelete(null);
          }}
          onConfirm={confirmDeleteLocation}
        />
      )}

      {/* ====================================== */}
      {/* ADD LOCATION MODAL */}
      {/* ====================================== */}

      {showAddLocationModal && groupId && (
        <AddLocationModal
          groupId={groupId}
          onClose={() => setShowAddLocationModal(false)}
          onSuccess={() => {
            setShowAddLocationModal(false);
            refreshAfterAddLocation();
          }}
        />
      )}
    </main>
  );
}
