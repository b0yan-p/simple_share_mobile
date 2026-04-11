import { Component, input } from '@angular/core';
import { IonButton, IonSpinner } from '@ionic/angular/standalone';
import { PaginatorService } from 'src/app/core/services/paginator.service';

@Component({
  selector: 'app-paginator',
  templateUrl: './paginator.component.html',
  styleUrls: ['./paginator.component.scss'],
  imports: [IonSpinner, IonButton],
})
export class PaginatorComponent {
  service = input.required<PaginatorService>();
}
