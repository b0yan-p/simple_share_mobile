import { AsyncPipe } from '@angular/common';
import { Component, effect, inject, OnInit, untracked, viewChild } from '@angular/core';
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
  ViewWillEnter,
  ViewWillLeave,
} from '@ionic/angular/standalone';
import { BehaviorSubject, catchError, combineLatest, map, of, switchMap } from 'rxjs';
import { NetworkService } from 'src/app/core/services/network.service';
import { ExpenseListComponent } from 'src/app/features/expenses/components/expense-list/expense-list.component';
import { OfflineWarningComponent } from 'src/app/shared/components/offline-warning/offline-warning.component';
import { AddMemberModalComponent } from '../../components/add-member-modal/add-member-modal.component';
import { GroupBalanceComponent } from '../../components/group-balance/group-balance.component';
import { GroupOverviewHeaderComponent } from '../../components/group-overview-header/group-overview-header.component';
import { GroupMember } from '../../models/group-member.model';
import { GroupDetailStore, GroupDetailTab } from '../../services/group-detail-store';
import { GroupFacade } from '../../services/group-facade.service';
import { GroupMemberFacade } from '../../services/group-member-facade.service';
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
    OfflineWarningComponent,
  ],
})
export class GroupDetailWrapperComponent implements OnInit, ViewWillEnter, ViewWillLeave {
  private route = inject(ActivatedRoute);
  private groupFacade = inject(GroupFacade);
  private groupMemberFacade = inject(GroupMemberFacade);
  private modalController = inject(ModalController);
  readonly store = inject(GroupDetailStore);
  protected networkService = inject(NetworkService);

  private readonly content = viewChild(IonContent);
  private scrollEl?: HTMLElement;

  private refresh$ = new BehaviorSubject<void>(undefined);

  title = 'Group';
  members: GroupMember[] = [];

  /**
   * Emits null instead of erroring when the overview is unavailable. The screen
   * shell no longer depends on this, and it must not: an errored observable never
   * emits again, which is what used to leave the whole page blank offline.
   */
  group$ = this.route.params.pipe(
    switchMap((p) => this.groupFacade.loadGroupOverview(p['id'])),
    catchError(() => of(null)),
  );

  private groupId$ = this.route.params.pipe(
    map((p) => p['id'] as string),
    takeUntilDestroyed(),
  );

  members$ = combineLatest([this.route.params, this.refresh$]).pipe(
    switchMap(([p]) =>
      this.groupMemberFacade
        .getGroupMembers(p['id'])
        .pipe(catchError(() => of([] as GroupMember[]))),
    ),
    takeUntilDestroyed(),
  );

  constructor() {
    // The view query only resolves after the first render, which is later than
    // ionViewWillEnter. Grab the scroll element and restore the moment it shows up.
    effect(() => {
      const content = this.content();
      if (!content) return;

      void content.getScrollElement().then((el) => {
        this.scrollEl = el;
        this.restoreScroll(untracked(() => this.store.activeTab()));
      });
    });
  }

  ngOnInit(): void {
    this.groupId$.subscribe((groupId) => this.store.enter(groupId));
    this.members$.subscribe((e) => (this.members = e ?? []));
  }

  /** Re-entering from a pushed page (expense detail) — go back to where we were. */
  ionViewWillEnter(): void {
    this.restoreScroll(this.store.activeTab());
  }

  ionViewWillLeave(): void {
    this.saveScroll(this.store.activeTab());
  }

  selectTab(tab: GroupDetailTab): void {
    const previous = this.store.activeTab();
    if (previous === tab) return;

    this.saveScroll(previous);
    this.store.activeTab.set(tab);
    this.restoreScroll(tab);
  }

  /** Synchronous on purpose: it has to read scrollTop before @switch re-renders. */
  private saveScroll(tab: GroupDetailTab): void {
    if (this.scrollEl) this.store.setScrollTop(tab, this.scrollEl.scrollTop);
  }

  /** Deferred: @switch has to render the incoming tab before it has any height. */
  private restoreScroll(tab: GroupDetailTab): void {
    const target = this.store.scrollTopFor(tab);
    requestAnimationFrame(() => void this.content()?.scrollToPoint(0, target, 0));
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
