"use client";

import { useTranslations } from "next-intl";
import { MyGroups } from "./my-group";
import { Spinner } from "@/app/components/ui/spinner";
import type { GroupItem } from "./group-card";

interface OwnedGroupsSectionProps {
  groups: GroupItem[];
  loading: boolean;
  refreshing: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onOpenGroup: (group: GroupItem) => void;
  onAddGroupClick: () => void;
}

export function OwnedGroupsSection({
  groups,
  loading,
  refreshing,
  hasMore,
  onLoadMore,
  onOpenGroup,
  onAddGroupClick,
}: OwnedGroupsSectionProps) {
  const t = useTranslations("home");

  return (
    <section className="rounded-3xl border border-[#b6cfc6] bg-white p-8 shadow-xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#3d3461]">{t("myGroups")}</h2>
          <p className="mt-1 text-gray-500">{t("myGroupsSubtitle")}</p>
        </div>
        {refreshing && <Spinner />}
      </div>

      <div className="mb-8">
        <button
          type="button"
          onClick={onAddGroupClick}
          className="w-full rounded-xl bg-[#3d3461] px-6 py-3 font-semibold text-white transition hover:bg-[#544a85]"
        >
          {t("addGroup")}
        </button>
      </div>

      <div className={`grid gap-4 transition-opacity ${refreshing ? "opacity-50" : "opacity-100"}`}>
        <MyGroups groups={groups} onOpen={onOpenGroup} />

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