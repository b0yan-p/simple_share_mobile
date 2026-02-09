import { Injectable } from '@angular/core';
import { BaseService } from 'src/app/core/services/base.service';
import { Activity } from '../models/activity.model';

@Injectable({
  providedIn: 'root',
})
export class ActivityService extends BaseService<Activity> {
  protected override get ctrlApi() {
    return 'activity';
  }

  protected override get listApi() {
    return 'me';
  }
}
