/**
 * Backend has no JsonStringEnumConverter registered, so GroupRole arrives on the
 * wire as its numeric value — keep these in sync with Models/Enums/GroupRole.cs.
 */
export const GroupRole = { Member: 0, Owner: 1 } as const;
export type GroupRole = (typeof GroupRole)[keyof typeof GroupRole];

export interface GroupMember {
  memberId: string;
  userId: string | null;
  displayName: string;
  groupRole: GroupRole;
  joinedAt: string;
}

/** A member without a linked account — added to the group just to split costs. */
export function isVirtualMember(member: GroupMember): boolean {
  return member.userId === null;
}

export function isGroupOwner(member: GroupMember): boolean {
  return member.groupRole === GroupRole.Owner;
}
