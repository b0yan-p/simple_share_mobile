import { Component, computed, inject, OnInit } from '@angular/core';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { TokenStorageService } from 'src/app/auth/services/token-storage.service';
import { NetworkService } from 'src/app/core/services/network.service';
import { RecentGroupsComponent } from 'src/app/features/groups/components/recent-groups/recent-groups.component';
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
export class HomeComponent implements OnInit {
  private tokenStorage = inject(TokenStorageService);
  protected networkService = inject(NetworkService);

  firstName = computed(() => this.tokenStorage.user()?.firstName?.trim() ?? '');

  ngOnInit() {
    if (!this.tokenStorage.user()) {
      this.tokenStorage.getUser().subscribe();
    }
  }
}
