"use client";

import { useTranslations } from "next-intl";
import { JoinedGroups } from "./joined-group";
import { JoinGroupForm } from "./join-group-form";
import { Spinner } from "@/app/components/ui/spinner";
import type { GroupItem } from "./group-card";

interface JoinedGroupsSectionProps {
  groups: GroupItem[];
  loading: boolean;
  refreshing: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onOpenGroup: (group: GroupItem) => void;
  onJoin: (joinCode: string) => Promise<void>;
}

export function JoinedGroupsSection({
  groups,
  loading,
  refreshing,
  hasMore,
  onLoadMore,
  onOpenGroup,
  onJoin,
}: JoinedGroupsSectionProps) {
  const t = useTranslations("home");

  return (
    <section className="rounded-3xl bg-white p-8 shadow-xl border border-[#b6cfc6]" aria-labelledby="member-groups-title">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 id="member-groups-title" className="text-2xl font-bold text-[#3d3461]">
            {t("memberGroups")}
          </h2>
          <p className="mt-1 text-gray-500">{t("memberGroupsSubtitle")}</p>
        </div>
        {refreshing && <Spinner />}
      </div>

      <JoinGroupForm onJoin={onJoin} />

      <div id="member-groups-list" className={`grid gap-4 transition-opacity ${refreshing ? "opacity-50" : "opacity-100"}`}>
        <JoinedGroups groups={groups} onOpen={onOpenGroup} />

        {loading && (
          <p className="flex items-center gap-2 text-gray-500 text-sm">
            <Spinner />
            {t("loadingNextBatch")}
          </p>
        )}

        {hasMore && !loading && (
          <button
            onClick={onLoadMore}
            className="px-6 py-2.5 bg-[#3d3461] text-white font-medium rounded-lg active:bg-[#544a85] hover:bg-[#544a85] transition shadow-sm text-sm"
          >
            {t("loadMoreGroups")}
          </button>
        )}
      </div>
    </section>
  );
}