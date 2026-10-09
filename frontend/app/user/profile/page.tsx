"use client";

import { ProfilePageContent } from "@/app/components/profile/profile-page-content";
import { useProfile } from "@/app/components/profile/hooks/use-profile";
import { useInvites } from "@/app/components/profile/hooks/use-invites";

export default function ProfilePage() {
  const {
    user,
    loading,
    updateError,
    updateUsername,
  } = useProfile();

  const {
    invites,
    loading: invitesLoading,
    error: invitesError,
    acceptInvite,
    declineInvite,
  } = useInvites();

  return (
    <ProfilePageContent
      user={user}
      loading={loading}
      updateError={updateError}
      onUpdateUsername={updateUsername}
      invites={invites}
      invitesLoading={invitesLoading}
      invitesError={invitesError}
      onAcceptInvite={acceptInvite}
      onDeclineInvite={declineInvite}
    />
  );
}