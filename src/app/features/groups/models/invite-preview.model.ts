/** The group's shareable invite link. Minted with the group, never rotated. */
export interface GroupInvitation {
  id: string;
  groupId: string;
  token: string;
  createdAtUtc: string;
  expiresAtUtc: string | null;
  isActive: boolean;
  useCount: number;
}

/** Public: what the invite screen may show before the user has an account. */
export interface InvitePreview {
  groupId: string;
  groupName: string;
  memberCount: number;
}

export interface JoinGroupResponse {
  groupId: string;
  memberId: string;
  /** True when the caller was already in the group — still a success. */
  alreadyMember: boolean;
}
