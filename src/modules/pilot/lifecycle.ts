export const PILOT_LIFECYCLE_VERSION = "pilot-lifecycle-2026-08-06";

export const pilotSuspensionCauses = [
  "participant_withdrawal",
  "deletion_request",
  "suspected_real_personal_data",
  "real_document_uploaded",
  "external_provider_enabled",
  "payment_attempt_real",
  "legal_contradiction_detected",
  "admin_privilege_violation",
  "cross_user_access_attempt",
  "prd_2026_activation_attempt",
] as const;

export type PilotSuspensionCause = (typeof pilotSuspensionCauses)[number];

export const pilotLifecycleStates = [
  "invited",
  "accepted",
  "active",
  "withdrawn",
  "deletion_requested",
  "suspended",
  "deleted",
] as const;

export type PilotLifecycleState = (typeof pilotLifecycleStates)[number];

export type PilotParticipant = {
  id: string;
  userId: string;
  state: PilotLifecycleState;
  acceptedPrivacyVersion?: string | null;
  suspendedCause?: PilotSuspensionCause | null;
};

export type PilotTransition =
  | { ok: true; next: PilotParticipant; event: string }
  | { ok: false; reason: string };

function isClosed(state: PilotLifecycleState) {
  return state === "withdrawn" || state === "deleted";
}

export function acceptPilotInvitation(
  participant: PilotParticipant,
  privacyVersion: string,
): PilotTransition {
  if (participant.state !== "invited") return { ok: false, reason: "invitation_not_open" };
  if (!privacyVersion.trim()) return { ok: false, reason: "privacy_version_required" };

  return {
    ok: true,
    event: "pilot.invitation.accepted",
    next: { ...participant, state: "accepted", acceptedPrivacyVersion: privacyVersion.trim() },
  };
}

export function activatePilotParticipation(participant: PilotParticipant): PilotTransition {
  if (participant.state !== "accepted") return { ok: false, reason: "participant_not_accepted" };
  return { ok: true, event: "pilot.participation.activated", next: { ...participant, state: "active" } };
}

export function withdrawPilotParticipation(participant: PilotParticipant): PilotTransition {
  if (isClosed(participant.state)) return { ok: false, reason: "participant_already_closed" };
  return {
    ok: true,
    event: "pilot.participation.withdrawn",
    next: { ...participant, state: "withdrawn" },
  };
}

export function requestPilotDeletion(participant: PilotParticipant): PilotTransition {
  if (participant.state === "deleted") return { ok: false, reason: "participant_already_deleted" };
  return {
    ok: true,
    event: "pilot.deletion.requested",
    next: { ...participant, state: "deletion_requested" },
  };
}

export function completePilotDeletion(participant: PilotParticipant): PilotTransition {
  if (participant.state !== "deletion_requested") {
    return { ok: false, reason: "deletion_not_requested" };
  }
  return { ok: true, event: "pilot.deletion.completed", next: { ...participant, state: "deleted" } };
}

export function suspendPilotParticipation(
  participant: PilotParticipant,
  cause: PilotSuspensionCause,
): PilotTransition {
  if (!pilotSuspensionCauses.includes(cause)) return { ok: false, reason: "unknown_cause" };
  if (participant.state === "deleted") return { ok: false, reason: "participant_already_deleted" };

  return {
    ok: true,
    event: `pilot.suspended.${cause}`,
    next: { ...participant, state: "suspended", suspendedCause: cause },
  };
}
