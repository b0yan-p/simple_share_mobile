import { Component, computed, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonRefresher,
  IonRefresherContent,
  IonTitle,
  IonToolbar,
  ViewWillEnter,
} from '@ionic/angular/standalone';
import { Observable } from 'rxjs';
import { TokenStorageService } from 'src/app/auth/services/token-storage.service';
import { NetworkService } from 'src/app/core/services/network.service';
import { RecentGroupsComponent } from 'src/app/features/groups/components/recent-groups/recent-groups.component';
import { GroupFacade } from 'src/app/features/groups/services/group-facade.service';
import { OfflineWarningComponent } from 'src/app/shared/components/offline-warning/offline-warning.component';
import { RefreshDirective } from 'src/app/shared/directives/refresher.directive';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  imports: [
    IonButton,
    IonContent,
    IonTitle,
    IonToolbar,
    IonHeader,
    IonRefresher,
    IonRefresherContent,
    RecentGroupsComponent,
    OfflineWarningComponent,
    RefreshDirective,
  ],
})
export class HomeComponent implements OnInit, ViewWillEnter {
  private tokenStorage = inject(TokenStorageService);
  private groupFacade = inject(GroupFacade);
  private router = inject(Router);
  protected networkService = inject(NetworkService);

  firstName = computed(() => this.tokenStorage.user()?.firstName?.trim() ?? '');

  ngOnInit() {
    if (!this.tokenStorage.user()) {
      this.tokenStorage.getUser().subscribe();
    }
  }

  ionViewWillEnter(): void {
    this.groupFacade.loadRecentGroups();
  }

  readonly onRefresh = (): Observable<void> => this.groupFacade.refreshRecentGroups();

  protected openCreateGroup(): void {
    void this.router.navigate(['/groups', 'new']);
  }
}
