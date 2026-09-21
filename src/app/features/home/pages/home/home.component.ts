import { DecimalPipe } from '@angular/common';
import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  IonContent,
  IonHeader,
  IonSpinner,
  IonTitle,
  IonToolbar,
  ViewWillEnter,
} from '@ionic/angular/standalone';
import { catchError, finalize, of } from 'rxjs';
import { TokenStorageService } from 'src/app/auth/services/token-storage.service';
import { NetworkService } from 'src/app/core/services/network.service';
import { ToastService } from 'src/app/core/services/toast.service';
import { RecentGroupsComponent } from 'src/app/features/groups/components/recent-groups/recent-groups.component';
import { GroupFacade } from 'src/app/features/groups/services/group-facade.service';
import { OfflineWarningComponent } from 'src/app/shared/components/offline-warning/offline-warning.component';
import { BalanceSummary } from '../../models/balance-summary.model';
import { BalanceSummaryService } from '../../services/balance-summary.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  imports: [
    IonContent,
    IonTitle,
    IonToolbar,
    IonHeader,
    IonSpinner,
    DecimalPipe,
    RecentGroupsComponent,
    OfflineWarningComponent,
  ],
})
export class HomeComponent implements OnInit, ViewWillEnter {
  private tokenStorage = inject(TokenStorageService);
  private groupFacade = inject(GroupFacade);
  private balanceSummaryService = inject(BalanceSummaryService);
  private toastService = inject(ToastService);
  private destroyRef = inject(DestroyRef);
  protected networkService = inject(NetworkService);

  firstName = computed(() => this.tokenStorage.user()?.firstName?.trim() ?? '');

  balanceSummary = signal<BalanceSummary | null>(null);
  balanceLoading = signal(false);

  balanceLabel = computed(() => {
    const net = this.balanceSummary()?.net ?? 0;

    if (net === 0) return 'Settled up';

    return net > 0 ? 'You are owed' : 'You owe';
  });

  balanceAmount = computed(() => Math.abs(this.balanceSummary()?.net ?? 0));

  ngOnInit() {
    if (!this.tokenStorage.user()) {
      this.tokenStorage.getUser().subscribe();
    }
  }

  /**
   * Ionic keeps this tab page alive, so ngOnInit does not run again on re-entry.
   * Neither the recent groups nor the total balance keep freshness state, so every
   * entry reloads both from here - an expense added elsewhere changes the total.
   */
  ionViewWillEnter(): void {
    this.groupFacade.loadRecentGroups();
    this.loadBalanceSummary();
  }

  /**
   * Nothing is fetched offline: the card renders its offline branch instead of the amount,
   * so there is nothing to show and nothing worth caching.
   */
  private loadBalanceSummary(): void {
    if (!this.networkService.isOnline()) return;

    this.balanceLoading.set(true);

    this.balanceSummaryService
      .getMyBalanceSummary()
      .pipe(
        finalize(() => this.balanceLoading.set(false)),
        catchError((err: { message?: string }) => {
          console.warn('[API ERROR] balance summary', err);
          this.toastService.errorToast(err?.message ?? 'Failed to load your total balance');
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((summary) => this.balanceSummary.set(summary));
  }
}
