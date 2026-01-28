import { Component, inject, OnInit } from '@angular/core';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { GroupService } from 'src/app/features/groups/services/group.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  imports: [IonContent, IonTitle, IonToolbar, IonHeader],
})
export class HomeComponent implements OnInit {
  groupService = inject(GroupService);

  ngOnInit(): void {
    this.groupService.groups().subscribe({
      next: (res) => console.log('groups', res),
      error: (err) => console.error(err),
    });
  }
}
