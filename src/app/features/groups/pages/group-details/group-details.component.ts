import { AsyncPipe, NgClass } from '@angular/common';
import { Component, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonCol,
  IonContent,
  IonGrid,
  IonHeader,
  IonIcon,
  IonRow,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { switchMap, tap } from 'rxjs';
import { ExpenseListComponent } from 'src/app/features/expenses/components/expense-list/expense-list.component';
import { ChipComponent } from 'src/app/shared/components/chip/chip.component';
import { GroupService } from '../../services/group.service';

@Component({
  selector: 'app-group-details',
  templateUrl: './group-details.component.html',
  styleUrls: ['./group-details.component.scss'],
  imports: [
    IonIcon,
    IonButton,
    IonRow,
    IonGrid,
    IonCol,
    AsyncPipe,
    IonContent,
    IonTitle,
    IonBackButton,
    IonButtons,
    IonToolbar,
    IonHeader,
    ExpenseListComponent,
    ChipComponent,
    NgClass,
  ],
})
export class GroupDetailsComponent {
  service = inject(GroupService);
  route = inject(ActivatedRoute);

  title = 'Group';

  group$ = this.route.params.pipe(
    switchMap((p) => this.service.groupOverview(p['id'])),
    tap((e) => (this.title = e.name)),
    takeUntilDestroyed(),
  );
}
