import { Injectable } from '@angular/core';
import { BaseApiService } from 'src/app/core/services/base-api.service';
import { CreateGroup } from '../models/create-group.model';
import { GroupListItem } from '../models/group.model';
import { UpdateGroup } from '../models/update-group.model';

@Injectable({
  providedIn: 'root',
})
export class GroupService extends BaseApiService<GroupListItem, CreateGroup, UpdateGroup> {
  protected override ctrlApi = 'group';
}
