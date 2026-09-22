import { AsyncPipe } from '@angular/common';
import { Component, effect, inject, OnInit, untracked, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonPopover,
  IonRefresher,
  IonRefresherContent,
  IonSegment,
  IonSegmentButton,
  IonTitle,
  IonToolbar,
  ModalController,
  ViewWillEnter,
  ViewWillLeave,
} from '@ionic/angular/standalone';
import {
  BehaviorSubject,
  catchError,
  combineLatest,
  forkJoin,
  map,
  Observable,
  of,
  shareReplay,
  Subject,
  switchMap,
  tap,
} from 'rxjs';
import { NetworkService } from 'src/app/core/services/network.service';
import { ExpenseListComponent } from 'src/app/features/expenses/components/expense-list/expense-list.component';
import { ExpenseFacade } from 'src/app/features/expenses/services/expense-facade.service';
import { OfflineWarningComponent } from 'src/app/shared/components/offline-warning/offline-warning.component';
import { RefreshDirective } from 'src/app/shared/directives/refresher.directive';
import { runAndSettle } from 'src/app/shared/utils/settle.helper';
import { AddMemberModalComponent } from '../../components/add-member-modal/add-member-modal.component';
import { GroupBalanceComponent } from '../../components/group-balance/group-balance.component';
import { GroupMembersModalComponent } from '../../components/group-members-modal/group-members-modal.component';
import { GroupOverviewHeaderComponent } from '../../components/group-overview-header/group-overview-header.component';
import { GroupMember } from '../../models/group-member.model';
import { GroupBalanceFacade } from '../../services/group-balance-facade.service';
import { GroupFacade } from '../../services/group-facade.service';
import { GroupMemberFacade } from '../../services/group-member-facade.service';
import { GroupDetailStore, GroupDetailTab } from '../../store/group-detail-store';
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
    IonList,
    IonItem,
    IonPopover,
    IonRefresher,
    IonRefresherContent,
    RefreshDirective,
    GroupDetailsComponent,
    ExpenseListComponent,
    GroupBalanceComponent,
    GroupOverviewHeaderComponent,
    OfflineWarningComponent,
  ],
})
export class GroupDetailWrapperComponent implements OnInit, ViewWillEnter, ViewWillLeave {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private groupFacade = inject(GroupFacade);
  private groupMemberFacade = inject(GroupMemberFacade);
  private expenseFacade = inject(ExpenseFacade);
  private balanceFacade = inject(GroupBalanceFacade);
  private modalController = inject(ModalController);
  readonly store = inject(GroupDetailStore);
  protected networkService = inject(NetworkService);

  private readonly content = viewChild(IonContent);
  private scrollEl?: HTMLElement;

  private refresh$ = new BehaviorSubject<void>(undefined);

  /** Nexted once the overview + members pair for the current cycle has landed. */
  private readonly shellSettled = new Subject<void>();

  title = 'Group';
  members: GroupMember[] = [];

  /**
   * The always-visible part of the screen: the overview header and the member
   * list. Loaded as one pair so a refresh has a single point to wait on, and
   * driven by refresh$ so a pull — or a member modal closing — re-fetches both.
   *
   * Each side collapses to a neutral value instead of erroring. The screen shell
   * must not depend on either: an errored observable never emits again, which is
   * what used to leave the whole page blank offline.
   */
  shell$ = combineLatest([this.route.params, this.refresh$]).pipe(
    switchMap(([p]) =>
      forkJoin({
        group: this.groupFacade.loadGroupOverview(p['id']).pipe(catchError(() => of(null))),
        members: this.groupMemberFacade
          .getGroupMembers(p['id'])
          .pipe(catchError(() => of([] as GroupMember[]))),
      }),
    ),
    tap(({ members }) => (this.members = members)),
    tap(() => this.shellSettled.next()),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  private groupId$ = this.route.params.pipe(
    map((p) => p['id'] as string),
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
  }

  /**
   * One gesture, the whole screen: the header, the member list and all three
   * tabs — including the two that @switch has not rendered, which is why the
   * expenses and balances stores are root-provided.
   */
  readonly onRefresh = (): Observable<void> => {
    const groupId = this.route.snapshot.params['id'];

    return forkJoin([
      runAndSettle(this.shellSettled, () => this.refresh$.next()),
      this.expenseFacade.reloadExpenses(groupId),
      this.balanceFacade.loadBalances(groupId),
    ]).pipe(map(() => void 0));
  };

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

  /** The group form doubles as the edit screen — same route the list uses. */
  navigateToEdit(): void {
    void this.router.navigate(['groups', this.route.snapshot.params['id']]);
  }

  /**
   * Full screen rather than a sheet: it is a list you scroll and drill into, and
   * the "Add people" sheet has to be able to sit on top of it.
   */
  async openMembers(currentMemberId: string | null): Promise<void> {
    const modal = await this.modalController.create({
      component: GroupMembersModalComponent,
      componentProps: {
        groupId: this.route.snapshot.params['id'],
        currentMemberId,
      },
      cssClass: 'modal-fullscreen',
    });

    await modal.present();
    const { role } = await modal.onWillDismiss();

    if (role === 'confirm') {
      this.refresh$.next();
    }
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
