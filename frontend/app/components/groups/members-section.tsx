"use client";

import { useTranslations } from "next-intl";
import type { GroupMember } from "./types";

type MemberListTone = "owner" | "admin" | "neutral";

const TONE_STYLES: Record<
  MemberListTone,
  { heading: string; row: string; badge: string }
> = {
  owner: {
    heading: "text-green-700",
    row: "border-green-200 bg-green-50",
    badge: "bg-green-600 text-white",
  },
  admin: {
    heading: "text-blue-700",
    row: "border-blue-200 bg-blue-50",
    badge: "bg-blue-600 text-white",
  },
  neutral: {
    heading: "text-gray-600",
    row: "border-gray-200 bg-white",
    badge: "bg-gray-300 text-gray-700",
  },
};

interface MemberListProps {
  title: string;
  badgeLabel: string;
  members: GroupMember[];
  tone: MemberListTone;
  emptyLabel?: string;
  className?: string;
}

function MemberList({
  title,
  badgeLabel,
  members,
  tone,
  emptyLabel,
  className = "mb-6",
}: MemberListProps) {
  const styles = TONE_STYLES[tone];

  return (
    <div className={className}>
      <h3
        className={`mb-3 text-sm font-bold uppercase tracking-wide ${styles.heading}`}
      >
        {title}
      </h3>

      <div className="space-y-2">
        {members.length === 0 && emptyLabel ? (
          <p className="text-sm text-gray-500">{emptyLabel}</p>
        ) : (
          members.map((member) => (
            <div
              key={member.name}
              className={`flex items-center justify-between rounded-lg border p-4 ${styles.row}`}
            >
              <span className="font-semibold text-gray-900">
                {member.name}
              </span>

              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${styles.badge}`}
              >
                {badgeLabel}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

interface MembersSectionProps {
  members: GroupMember[];
}

export function MembersSection({ members }: MembersSectionProps) {
  const t = useTranslations("group");

  const ownerMembers = members.filter((member) => member.role === "owner");
  const adminMembers = members.filter((member) => member.role === "admin");
  const normalMembers = members.filter((member) => member.role === "member");
  const guestMembers = members.filter((member) => member.role === "guest");

  return (
    <section className="mt-8 rounded-2xl border border-gray-200 bg-gray-50 p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">
          {t("members")}
        </h2>

        <span className="rounded-full bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700">
          {t("memberCount", { count: members.length })}
        </span>
      </div>

      <MemberList
        title={t("owner")}
        badgeLabel={t("owner")}
        members={ownerMembers}
        tone="owner"
      />

      <MemberList
        title={t("admins")}
        badgeLabel={t("adminBadge")}
        members={adminMembers}
        tone="admin"
        emptyLabel={t("noAdmins")}
      />

      <MemberList
        title={t("members")}
        badgeLabel={t("memberBadge")}
        members={normalMembers}
        tone="neutral"
        emptyLabel={t("noMembers")}
      />

      <MemberList
        title={t("guests")}
        badgeLabel={t("guestBadge")}
        members={guestMembers}
        tone="neutral"
        emptyLabel={t("noGuests")}
        className=""
      />
    </section>
  );
}
