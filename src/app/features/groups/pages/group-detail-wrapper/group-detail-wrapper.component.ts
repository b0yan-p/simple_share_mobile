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
  ModalController,
} from '@ionic/angular/standalone';
import { BehaviorSubject, catchError, combineLatest, of, switchMap } from 'rxjs';
import { ExpenseListComponent } from 'src/app/features/expenses/components/expense-list/expense-list.component';
import { AddMemberModalComponent } from '../../components/add-member-modal/add-member-modal.component';
import { GroupBalanceComponent } from '../../components/group-balance/group-balance.component';
import { GroupOverviewHeaderComponent } from '../../components/group-overview-header/group-overview-header.component';
import { GroupMember } from '../../models/group-member.model';
import { GroupMemberFacade } from '../../services/group-member-facade.service';
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
  private groupMemberFacade = inject(GroupMemberFacade);
  private modalController = inject(ModalController);

  private refresh$ = new BehaviorSubject<void>(undefined);

  title = 'Group';
  activeTab = 'overview';
  members: GroupMember[] = [];

  group$ = this.route.params.pipe(switchMap((p) => this.service.groupOverview(p['id'])));

  members$ = combineLatest([this.route.params, this.refresh$]).pipe(
    switchMap(([p]) =>
      this.groupMemberFacade.getGroupMembers(p['id']).pipe(catchError(() => of([] as GroupMember[]))),
    ),
    takeUntilDestroyed(),
  );

  ngOnInit(): void {
    this.members$.subscribe((e) => (this.members = e ?? []));
  }

  async openAddMembers(): Promise<void> {
    const groupId = this.route.snapshot.params['id'];

    const modal = await this.modalController.create({
      component: AddMemberModalComponent,
      componentProps: {
        groupId,
        existingMemberIds: this.members.map((m) => m.memberId),
      },
      breakpoints: [0, 0.85],
      initialBreakpoint: 0.85,
    });

    await modal.present();
    const { role } = await modal.onWillDismiss();

    if (role === 'confirm') {
      this.refresh$.next();
    }
  }
}
