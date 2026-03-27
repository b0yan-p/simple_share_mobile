import { AsyncPipe, DecimalPipe, NgClass } from '@angular/common';
import { Component, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { IonGrid, IonRow } from '@ionic/angular/standalone';
import { BehaviorSubject, first, switchMap } from 'rxjs';
import { ChipComponent } from 'src/app/shared/components/chip/chip.component';
import { GroupBalanceOverviewComponent } from '../../components/group-balance-overview/group-balance-overview.component';
import { GroupService } from '../../services/group.service';

@Component({
  selector: 'app-group-details',
  templateUrl: './group-details.component.html',
  styleUrls: ['./group-details.component.scss'],
  standalone: true,
  imports: [
    NgClass,
    AsyncPipe,
    DecimalPipe,
    IonGrid,
    IonRow,
    ChipComponent,
    GroupBalanceOverviewComponent,
  ],
})
export class GroupDetailsComponent {
  private service = inject(GroupService);
  private route = inject(ActivatedRoute);

  private readonly refresh$ = new BehaviorSubject<void>(undefined);

  group$ = this.refresh$.pipe(
    switchMap(() => this.route.params.pipe(first())),
    switchMap((p) => this.service.groupOverview(p['id'])),
    takeUntilDestroyed(),
  );

  refresh(): void {
    this.refresh$.next();
  }
}
