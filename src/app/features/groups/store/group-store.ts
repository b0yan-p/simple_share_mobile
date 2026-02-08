import { inject, Injectable } from '@angular/core';
import { Store } from 'src/app/core/store/services/store';
import { GroupListItem } from '../models/group.model';
import { CreateGroup } from '../models/create-group.model';
import { UpdateGroup } from '../models/update-group.model';
import { GroupService } from '../services/group.service';

@Injectable({
  providedIn: 'root',
})
export class GroupStore extends Store<GroupListItem, CreateGroup, UpdateGroup> {
  service = inject(GroupService);

  constructor() {
    super();
    this.api = this.service;
  }
}
