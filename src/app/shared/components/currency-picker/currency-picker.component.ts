import { Component, computed, input, output, signal } from '@angular/core';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonModal,
  IonSearchbar,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  cashOutline,
  chevronForwardOutline,
  checkmarkCircle,
  chevronDownOutline,
  closeOutline,
  ellipseOutline,
  lockClosedOutline,
} from 'ionicons/icons';
import { FIAT_CURRENCIES } from '../../utils/currency-catalog';

@Component({
  selector: 'app-currency-picker',
  templateUrl: './currency-picker.component.html',
  styleUrl: './currency-picker.component.scss',
  imports: [
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonIcon,
    IonModal,
    IonSearchbar,
    IonTitle,
    IonToolbar,
  ],
})
export class CurrencyPickerComponent {
  readonly value = input.required<string>();
  readonly disabled = input(false);
  readonly compact = input(false);
  readonly label = input('Currency');
  readonly valueChange = output<string>();
  readonly opened = signal(false);
  readonly query = signal('');
  readonly selectedName = computed(
    () => FIAT_CURRENCIES.find((item) => item.code === this.value())?.name ?? '',
  );
  readonly filtered = computed(() => {
    const query = this.query().trim().toLocaleLowerCase();
    return FIAT_CURRENCIES.filter((item) =>
      `${item.code} ${item.name}`.toLocaleLowerCase().includes(query),
    );
  });

  constructor() {
    addIcons({
      cashOutline,
      chevronForwardOutline,
      checkmarkCircle,
      chevronDownOutline,
      closeOutline,
      ellipseOutline,
      lockClosedOutline,
    });
  }

  open() {
    if (this.disabled()) return;
    this.query.set('');
    this.opened.set(true);
  }

  select(code: string) {
    this.valueChange.emit(code);
    this.opened.set(false);
  }
}
