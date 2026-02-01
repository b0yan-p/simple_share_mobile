import { Component, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonTitle,
  IonToggle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { filter, switchMap } from 'rxjs';
import { ToastService } from 'src/app/core/services/toast.service';
import { UiService } from 'src/app/core/services/ui.service';
import { CreateGroup } from '../../models/create-group.model';
import { UpdateGroup } from '../../models/update-group.model';
import { GroupService } from '../../services/group.service';

@Component({
  selector: 'app-group-item',
  templateUrl: './group-item.component.html',
  styleUrls: ['./group-item.component.scss'],
  imports: [
    IonButton,
    IonItem,
    IonToggle,
    IonInput,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonTitle,
    IonContent,
    ReactiveFormsModule,
  ],
})
export class GroupItemComponent implements OnInit {
  route = inject(ActivatedRoute);
  service = inject(GroupService);
  uiService = inject(UiService);
  toastService = inject(ToastService);
  router = inject(Router);

  itemId = 'new';

  form = new FormGroup({
    id: new FormControl(),
    name: new FormControl<string>('', [Validators.required]),
    simplifyDebts: new FormControl<boolean>(false),
  });

  item$ = this.route.params.pipe(
    filter((p) => p['groupId'] !== 'new'),
    switchMap((p) => this.service.getOne(p['groupId'])),
    takeUntilDestroyed(),
  );

  ngOnInit() {
    this.item$.subscribe({
      next: (data) => {
        console.log(data);
        this.itemId = data.id;
        this.form.patchValue(data);
      },
    });
  }

  submit() {
    if (this.itemId === 'new') {
      this.create();
    } else {
      this.update();
    }
  }

  protected create() {
    this.service.create(this.form.value as CreateGroup).subscribe({
      next: (res) => {
        this.toastService.successToast('Group updated successfully!');
        this.router.navigate(['groups', res.id, 'details']);
      },
      error: (err) => {
        console.error('ERROR: ', err);
        this.toastService.errorToast(err);
      },
    });
  }

  protected update() {
    this.service.update(this.form.value as UpdateGroup).subscribe({
      next: (res) => {
        this.toastService.successToast('Group updated successfully!');
        this.router.navigate(['groups', res.id, 'details']);
      },
      error: (err) => {
        console.error('ERROR: ', err);
        this.toastService.errorToast(err);
      },
    });
  }
}
