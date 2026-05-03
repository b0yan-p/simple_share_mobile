import { Component } from '@angular/core';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { RecentGroupsComponent } from 'src/app/features/groups/components/recent-groups/recent-groups.component';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  imports: [IonContent, IonTitle, IonToolbar, IonHeader, RecentGroupsComponent],
})
export class HomeComponent {}
