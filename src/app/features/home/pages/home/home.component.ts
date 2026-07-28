import { Component, computed, inject, OnInit } from '@angular/core';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { TokenStorageService } from 'src/app/auth/services/token-storage.service';
import { RecentGroupsComponent } from 'src/app/features/groups/components/recent-groups/recent-groups.component';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  imports: [IonContent, IonTitle, IonToolbar, IonHeader, RecentGroupsComponent],
})
export class HomeComponent implements OnInit {
  private tokenStorage = inject(TokenStorageService);

  firstName = computed(() => this.tokenStorage.user()?.firstName?.trim() ?? '');

  ngOnInit() {
    if (!this.tokenStorage.user()) {
      this.tokenStorage.getUser().subscribe();
    }
  }
}
