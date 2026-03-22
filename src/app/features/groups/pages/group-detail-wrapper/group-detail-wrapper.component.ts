import { Component, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterModule } from '@angular/router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonLabel,
  IonSegment,
  IonSegmentButton,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { switchMap } from 'rxjs';
import { ExpenseListComponent } from 'src/app/features/expenses/components/expense-list/expense-list.component';
import { GroupBalanceComponent } from '../../components/group-balance/group-balance.component';
import { GroupService } from '../../services/group.service';
import { GroupDetailsComponent } from '../group-details/group-details.component';

@Component({
  selector: 'app-group-detail-wrapper',
  templateUrl: './group-detail-wrapper.component.html',
  styleUrls: ['./group-detail-wrapper.component.scss'],
  standalone: true,
  imports: [
    RouterModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonButton,
    IonIcon,
    IonContent,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    GroupDetailsComponent,
    ExpenseListComponent,
    GroupBalanceComponent,
  ],
})
export class GroupDetailWrapperComponent {
  private route = inject(ActivatedRoute);
  private service = inject(GroupService);

  title = 'Group';
  activeTab = 'overview';

  constructor() {
    this.route.params
      .pipe(
        switchMap((p) => this.service.groupOverview(p['id'])),
        takeUntilDestroyed(),
      )
      .subscribe((g) => (this.title = g.name));
  }
}
