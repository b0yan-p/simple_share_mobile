import { DatePipe, DecimalPipe, NgClass } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IonItem, IonList } from '@ionic/angular/standalone';
import { AvatarComponent } from 'src/app/shared/components/avatar/avatar.component';
import { ExpenseService } from '../../services/expense.service';

@Component({
  selector: 'app-expense-list',
  templateUrl: './expense-list.component.html',
  styleUrls: ['./expense-list.component.scss'],
  imports: [NgClass, DatePipe, DecimalPipe, IonList, IonItem, AvatarComponent],
})
export class ExpenseListComponent implements OnInit {
  route = inject(ActivatedRoute);
  service = inject(ExpenseService);

  ngOnInit() {
    this.service.getAll(this.route.snapshot.params['id']);
  }
}
