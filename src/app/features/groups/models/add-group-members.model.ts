import { GroupMember } from './group-member.model';

export interface AddGroupMemberItem {
  memberId?: string;
  displayName?: string;
  inviteUser: boolean;
  email?: string;
}

export interface AddGroupMembersRequest {
  members: AddGroupMemberItem[];
}

export interface AddGroupMembersResponse {
  members: GroupMember[];
  errorMessages: string[];
}
