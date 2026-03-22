import { AsyncPipe, DecimalPipe, NgClass } from '@angular/common';
import { Component, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { IonCol, IonGrid, IonRow } from '@ionic/angular/standalone';
import { switchMap } from 'rxjs';
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
    IonCol,
    ChipComponent,
    GroupBalanceOverviewComponent,
  ],
})
export class GroupDetailsComponent {
  private service = inject(GroupService);
  private route = inject(ActivatedRoute);

  group$ = this.route.params.pipe(
    switchMap((p) => this.service.groupOverview(p['id'])),
    takeUntilDestroyed(),
  );
}
