import { Component, computed, inject, OnInit } from '@angular/core';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  ViewWillEnter,
} from '@ionic/angular/standalone';
import { TokenStorageService } from 'src/app/auth/services/token-storage.service';
import { NetworkService } from 'src/app/core/services/network.service';
import { RecentGroupsComponent } from 'src/app/features/groups/components/recent-groups/recent-groups.component';
import { GroupFacade } from 'src/app/features/groups/services/group-facade.service';
import { OfflineWarningComponent } from 'src/app/shared/components/offline-warning/offline-warning.component';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  imports: [
    IonContent,
    IonTitle,
    IonToolbar,
    IonHeader,
    RecentGroupsComponent,
    OfflineWarningComponent,
  ],
})
export class HomeComponent implements OnInit, ViewWillEnter {
  private tokenStorage = inject(TokenStorageService);
  private groupFacade = inject(GroupFacade);
  protected networkService = inject(NetworkService);

  firstName = computed(() => this.tokenStorage.user()?.firstName?.trim() ?? '');

  ngOnInit() {
    if (!this.tokenStorage.user()) {
      this.tokenStorage.getUser().subscribe();
    }
  }

  /**
   * Ionic keeps this tab page alive, so ngOnInit does not run again on re-entry.
   * The recent groups have no freshness state, so every entry reloads from here.
   */
  ionViewWillEnter(): void {
    this.groupFacade.loadRecentGroups();
  }
}
