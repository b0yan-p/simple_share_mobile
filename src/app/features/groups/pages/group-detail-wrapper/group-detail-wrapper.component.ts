import { AsyncPipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
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
import { catchError, of, switchMap } from 'rxjs';
import { ExpenseListComponent } from 'src/app/features/expenses/components/expense-list/expense-list.component';
import { GroupBalanceComponent } from '../../components/group-balance/group-balance.component';
import { GroupOverviewHeaderComponent } from '../../components/group-overview-header/group-overview-header.component';
import { GroupMember } from '../../models/group-member.model';
import { GroupMemberIdbService } from '../../services/group-member-idb.service';
import { GroupService } from '../../services/group.service';
import { GroupDetailsComponent } from '../group-details/group-details.component';

@Component({
  selector: 'app-group-detail-wrapper',
  templateUrl: './group-detail-wrapper.component.html',
  styleUrls: ['./group-detail-wrapper.component.scss'],
  standalone: true,
  imports: [
    AsyncPipe,
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
    GroupOverviewHeaderComponent,
  ],
})
export class GroupDetailWrapperComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private service = inject(GroupService);
  private groupMemberIdb = inject(GroupMemberIdbService);

  title = 'Group';
  activeTab = 'overview';
  members: GroupMember[] = [];

  group$ = this.route.params.pipe(switchMap((p) => this.service.groupOverview(p['id'])));

  members$ = this.route.params.pipe(
    switchMap((p) =>
      this.service.getGroupMembers(p['id']).pipe(
        switchMap((members) => this.groupMemberIdb.getGroupMembers(p['id'])),
        catchError(() => of(void 0)),
      ),
    ),
    takeUntilDestroyed(),
  );

  ngOnInit(): void {
    this.members$.subscribe((e) => (this.members = e ?? []));
  }
}
