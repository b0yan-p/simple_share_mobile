import { AsyncPipe } from '@angular/common';
import {
  Component,
  effect,
  ElementRef,
  inject,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
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
  IonSpinner,
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
import { apiErrorMessage } from 'src/app/core/services/api-error';
import { ExpenseListComponent } from 'src/app/features/expenses/components/expense-list/expense-list.component';
import { ExpenseFacade } from 'src/app/features/expenses/services/expense-facade.service';
import { OfflineWarningComponent } from 'src/app/shared/components/offline-warning/offline-warning.component';
import { EmptyStateComponent } from 'src/app/shared/components/empty-state/empty-state.component';
import { RefreshDirective } from 'src/app/shared/directives/refresher.directive';
import { runAndSettle } from 'src/app/shared/utils/settle.helper';
import { AddMemberModalComponent } from '../../components/add-member-modal/add-member-modal.component';
import { GroupBalanceComponent } from '../../components/group-balance/group-balance.component';
import { GroupMembersModalComponent } from '../../components/group-members-modal/group-members-modal.component';
import { GroupOverviewHeaderComponent } from '../../components/group-overview-header/group-overview-header.component';
import { SettleUpBalancePickerComponent } from '../../components/settle-up-balance-picker/settle-up-balance-picker.component';
import { resolveGroupCover } from '../../models/group-cover-catalog';
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
    IonSpinner,
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
    EmptyStateComponent,
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
  protected readonly failedCoverUrl = signal('');
  readonly shellLoading = signal(true);
  readonly shellError = signal<string | null>(null);
  readonly membersError = signal<string | null>(null);

  private readonly content = viewChild(IonContent);
  private readonly contentElement = viewChild(IonContent, { read: ElementRef<HTMLElement> });
  private scrollEl?: HTMLElement;

  private readonly toolbar = viewChild('toolbar', { read: ElementRef<HTMLElement> });
  private readonly cover = viewChild('cover', { read: ElementRef<HTMLElement> });
  private readonly tabBody = viewChild<ElementRef<HTMLElement>>('tabBody');

  updateCover(scrollTop: number): void {
    const header = this.toolbar()?.nativeElement;
    const cover = this.cover()?.nativeElement;
    if (!header || !cover) return;

    const distance = Math.max(1, cover.offsetHeight - header.offsetHeight);
    const progress = Math.max(0, Math.min(1, scrollTop / distance));
    header.style.setProperty('--cover-progress', String(progress));
    header.classList.toggle('cover-toolbar-collapsed', progress === 1);
  }

  private refresh$ = new BehaviorSubject<void>(undefined);
  private settleUpOpen = false;

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
    switchMap(([p]) => {
      this.shellLoading.set(true);
      this.shellError.set(null);
      this.membersError.set(null);
      return forkJoin({
        group: this.groupFacade.loadGroupOverview(p['id']).pipe(
          catchError((err) => {
            this.shellError.set(apiErrorMessage(err, 'Could not load this group.'));
            return of(null);
          }),
        ),
        members: this.groupMemberFacade.getGroupMembers(p['id']).pipe(
          catchError((err) => {
            this.membersError.set(apiErrorMessage(err, 'Could not load group members.'));
            return of([] as GroupMember[]);
          }),
        ),
      });
    }),
    tap(({ group, members }) => {
      if (!group && !this.shellError())
        this.shellError.set('No saved group data is available.');
      this.shellLoading.set(false);
      this.members = members;
      this.failedCoverUrl.set('');
    }),
    map((shell) => ({
      ...shell,
      coverImage: shell.group && resolveGroupCover(shell.group.type, shell.group.coverImageKey),
    })),
    tap(() => this.shellSettled.next()),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  private groupId$ = this.route.params.pipe(
    map((p) => p['id'] as string),
    takeUntilDestroyed(),
  );

  constructor() {
    this.groupFacade.groupUpdated$.pipe(takeUntilDestroyed()).subscribe((groupId) => {
      if (groupId === this.route.snapshot.params['id']) this.refreshOverview();
    });

    effect((onCleanup) => {
      const header = this.toolbar()?.nativeElement;
      const content = this.contentElement()?.nativeElement;
      if (!header || !content) return;

      const syncToolbarHeight = () => {
        content.style.setProperty('--group-toolbar-height', `${header.offsetHeight}px`);
      };
      syncToolbarHeight();
      const observer = new ResizeObserver(syncToolbarHeight);
      observer.observe(header);
      onCleanup(() => observer.disconnect());
    });

    // The view query only resolves after the first render, which is later than
    // ionViewWillEnter. Grab the scroll element and restore the moment it shows up.
    effect(() => {
      const content = this.content();
      if (!content) return;

      void content.getScrollElement().then((el) => {
        this.scrollEl = el;
        this.restoreScroll(this.store.scrollTop());
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
    this.restoreScroll(this.store.scrollTop());
  }

  ionViewWillLeave(): void {
    if (this.scrollEl) this.store.scrollTop.set(this.scrollEl.scrollTop);
  }

  selectTab(tab: GroupDetailTab): void {
    const previous = this.store.activeTab();
    if (previous === tab) return;

    const target = this.scrollTopForTabSwitch();
    this.store.activeTab.set(tab);
    this.restoreScroll(target);
  }

  async openSettleUp(): Promise<void> {
    if (this.settleUpOpen) return;

    const groupId = this.route.snapshot.params['id'];
    this.settleUpOpen = true;

    try {
      const modal = await this.modalController.create({
        component: SettleUpBalancePickerComponent,
        componentProps: {
          groupId,
          onSubmittingChange: (submitting: boolean): void => {
            modal.canDismiss = !submitting;
          },
        },
        cssClass: 'settle-up-picker',
        htmlAttributes: { 'aria-label': 'Settle up' },
        breakpoints: [0, 0.85],
        initialBreakpoint: 0.85,
      });

      await modal.present();
      const { data, role } = await modal.onDidDismiss();

      if (role === 'confirm' && data?.success && this.route.snapshot.params['id'] === groupId) {
        this.refreshOverview();
        this.balanceFacade.loadBalances(groupId).subscribe();
      }
    } finally {
      this.settleUpOpen = false;
    }
  }

  refreshOverview(): void {
    this.refresh$.next();
  }

  private scrollTopForTabSwitch(): number {
    const header = this.toolbar()?.nativeElement;
    const body = this.tabBody()?.nativeElement;
    const scroll = this.scrollEl;
    if (!header || !body || !scroll) return 0;

    const stickyTop = this.cover() ? header.offsetHeight : 0;
    const tabPosition = body.getBoundingClientRect().top - scroll.getBoundingClientRect().top;
    const pinnedScrollTop = scroll.scrollTop + tabPosition - stickyTop;
    return Math.max(0, Math.min(scroll.scrollTop, pinnedScrollTop));
  }

  /** Deferred: @switch has to render the incoming tab before it has any height. */
  private restoreScroll(target: number): void {
    requestAnimationFrame(() => {
      if (!this.scrollEl) return;

      this.scrollEl.scrollTop = target;
      this.updateCover(this.scrollEl.scrollTop);
    });
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
