import { inject, Injectable } from '@angular/core';
import { TokenStorageService } from 'src/app/auth/services/token-storage.service';
import { BaseService } from 'src/app/core/services/base.service';
import {
  Activity,
  ActivityEntityType,
  ActivityExpenseData,
  ActivityExpenseUpdateData,
  ActivityListItem,
  ActivityMemberData,
  ActivitySettleUpData,
  ActivityType,
} from '../models/activity.model';

@Injectable({
  providedIn: 'root',
})
export class ActivityService extends BaseService<ActivityListItem> {
  storageService = inject(TokenStorageService);

  protected override get ctrlApi() {
    return 'activity';
  }

  protected override get listApi() {
    return 'me';
  }

  protected override customListMap(items: Activity[]): ActivityListItem[] {
    return items.map((e) => ({
      id: e.id,
      createdAt: e.createdAt,
      title: this.createTitle(e),
      description: '',
      details: { ...e },
    }));
  }

  private createTitle(item: Activity): string {
    switch (item.entityType) {
      case ActivityEntityType.Expense:
        return this.generateExpenseTitle(item);

      case ActivityEntityType.SettleUp:
        return this.generateSettleTitle(item);

      case ActivityEntityType.Member:
        return this.generateMemberTitle(item);
    }
  }

  private generateExpenseTitle(item: Activity): string {
    const expenseItem = (item.data as ActivityExpenseData).description;

    switch (item.type) {
      case ActivityType.ExpenseCreated:
        return `${item.actorName} added "${expenseItem}" in "${item.groupName}"`;

      case ActivityType.ExpenseUpdated: {
        const data: ActivityExpenseUpdateData = item.data as any;

        return `${item.actorName} updated ${data.changedFields.join(' and ')} in "${item.groupName}"`;
      }

      case ActivityType.ExpenseDeleted:
        return `${item.actorName} deleted "${expenseItem}" in "${item.groupName}"`;

      default:
        return '';
    }
  }

  private generateSettleTitle(item: Activity): string {
    const data: ActivitySettleUpData = item.data as any;
    return `${data.fromMemberName} paid to ${data.toMemberName} in "${item.groupName}"`;
  }

  private generateMemberTitle(item: Activity): string {
    const data = item.data as ActivityMemberData;

    if (item.type === ActivityType.MemberAddedToGroup)
      return `${item.actorName} added ${data.targetMemberName} in "${item.groupName}"`;
    else return `${item.actorName} removed ${data.targetMemberName} from "${item.groupName}"`;
  }
}

/*
    1. Expense
        - Add       - John added "Water" in "Group 1"
                        (You owe $7.34)
                        (Yesterday, 23:30)

        - Update    -  John updated (description/amount/involved user)
                        (You owe BAM 10.22)
                        (Yesterday, 23:30)

        - Delete    - You deleted "Water" in "Group 1"
                        (You get back $4)
                        (Yesterday, 23:30)

    2. Settle
        - USER_A paid to USER_B - You paid John in "Group 1"
                                    (You paid $0.18)
                                    (2 days ago, 23:30)

    3. Members
        - Added new member      - You added John in "Group 1"
                                    (5 Jan, 23:30)

        - Removed group member  - John removed Michael from "Group 1"
                                    (10/12/2025, 23:30)

 
    # Type of messages
        1. {who} {action} {what} in {where} - You added "Ice cream" in "Group 1"  -> actions (add, delete, update)
        2. {who} {action} {whom} in {where} - John paid you in "Group 1" -> actions (paid)
        3. {who} {action} {what_member} to the group "Group 1" -> actions (add, remove)

*/
