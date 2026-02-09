import { Component, input } from '@angular/core';
import { IonButton, IonSpinner } from '@ionic/angular/standalone';
import { BaseModel } from 'src/app/core/models/base-model';
import { BaseService } from 'src/app/core/services/base.service';

@Component({
  selector: 'app-paginator',
  templateUrl: './paginator.component.html',
  styleUrls: ['./paginator.component.scss'],
  imports: [IonSpinner, IonButton],
})
export class PaginatorComponent {
  service = input.required<BaseService<BaseModel>>();
}
