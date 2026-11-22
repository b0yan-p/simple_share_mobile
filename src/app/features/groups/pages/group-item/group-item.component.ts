import { CurrencyPickerComponent } from 'src/app/shared/components/currency-picker/currency-picker.component';
import { Component, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonFooter,
  IonHeader,
  IonInput,
  IonIcon,
  IonTitle,
  IonToggle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { peopleOutline, informationCircleOutline, gitNetworkOutline } from 'ionicons/icons';
import { ToastService } from 'src/app/core/services/toast.service';
import { UiService } from 'src/app/core/services/ui.service';
import { GroupTypePickerComponent } from '../../components/group-type-picker/group-type-picker.component';
import { GroupType } from '../../models/group-type.model';
import { CreateGroup } from '../../models/create-group.model';
import { UpdateGroup } from '../../models/update-group.model';
import { GroupFacade } from '../../services/group-facade.service';
import { GroupService } from '../../services/group.service';

@Component({
  selector: 'app-group-item',
  templateUrl: './group-item.component.html',
  styleUrls: ['./group-item.component.scss'],
  imports: [
    CurrencyPickerComponent,
    GroupTypePickerComponent,
    IonButton,
    IonIcon,
    IonToggle,
    IonInput,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonTitle,
    IonContent,
    IonFooter,
    ReactiveFormsModule,
  ],
})
export class GroupItemComponent implements OnInit {
  route = inject(ActivatedRoute);
  service = inject(GroupService);
  facade = inject(GroupFacade);
  uiService = inject(UiService);
  toastService = inject(ToastService);
  router = inject(Router);

  itemId = 'new';
  currencyLocked = false;

  form = new FormGroup({
    type: new FormControl(GroupType.Other, { nonNullable: true }),
    id: new FormControl(),
    currency: new FormControl('EUR', { nonNullable: true, validators: [Validators.required] }),
    name: new FormControl<string>('', [Validators.required]),
    simplifyDebts: new FormControl<boolean>(false),
  });

  item$ = this.service.getOne(this.route);

  constructor() {
    addIcons({ peopleOutline, informationCircleOutline, gitNetworkOutline });
  }

  ngOnInit() {
    this.item$.subscribe({
      next: (data) => {
        console.log(data);
        this.itemId = data.id;
        this.form.patchValue({ ...data, type: data.type ?? GroupType.Other });
        this.currencyLocked = !!data.currencyLocked;
        if (data.id !== 'new' && !data.canChangeCurrency) this.form.controls.currency.disable();
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
    this.facade.createGroup(this.form.value as CreateGroup).subscribe({
      next: (res) => {
        this.toastService.successToast('Group created successfully!');
        // replaceUrl drops the form from the navigation stack , otherwise back
        // returns to the still-filled form and save creates a duplicate group.
        this.router.navigate(['groups', res.id, 'details'], { replaceUrl: true });
      },
      error: (err) => {
        console.error('ERROR: ', err);
        this.toastService.errorToast(err?.error?.detail ?? err.message);
      },
    });
  }

  protected update() {
    this.facade.updateGroup(this.form.value as UpdateGroup).subscribe({
      next: (res) => {
        this.toastService.successToast('Group updated successfully!');
        this.router.navigate(['groups', res.id, 'details'], { replaceUrl: true });
      },
      error: (err) => {
        console.error('ERROR: ', err);
        this.toastService.errorToast(err?.error?.detail ?? err.message);
      },
    });
  }
}
