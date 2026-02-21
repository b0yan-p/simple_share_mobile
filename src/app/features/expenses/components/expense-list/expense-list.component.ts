import { DatePipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ExpenseService } from '../../services/expense.service';

@Component({
  selector: 'app-expense-list',
  templateUrl: './expense-list.component.html',
  styleUrls: ['./expense-list.component.scss'],
  imports: [DatePipe],
})
export class ExpenseListComponent implements OnInit {
  route = inject(ActivatedRoute);
  service = inject(ExpenseService);

  ngOnInit() {
    this.service.getAll(this.route.snapshot.params['id']);
  }
}
