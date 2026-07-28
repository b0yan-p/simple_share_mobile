import { inject, Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular';

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private toastController = inject(ToastController);

  private currentToast: HTMLIonToastElement | null = null;
  protected position: ToastPosition = 'top';
  protected toastDuration = 5000;

  public async successToast(message: string, duration: number = this.toastDuration) {
    await this.showToast(message, duration, 'toast-success', 'checkmark');
  }

  public async errorToast(message: string, duration: number = this.toastDuration) {
    await this.showToast(message, duration, 'toast-error', 'close');
  }

  public async warnToast(message: string, duration: number = this.toastDuration) {
    await this.showToast(message, duration, 'toast-warning', 'alert');
  }

  public async infoToast(message: string, duration: number = this.toastDuration) {
    await this.showToast(message, duration, 'toast-info', 'information');
  }

  protected async showToast(
    message: string,
    duration = this.toastDuration,
    stateClass = 'toast-info',
    icon = 'information',
  ) {
    if (!!this.currentToast) {
      await this.currentToast.dismiss();
    }

    const toast = await this.toastController.create({
      message,
      duration,
      icon,
      position: this.position,
      animated: true,
      swipeGesture: 'vertical',
      cssClass: `custom-toast ${stateClass}`,
    });

    await toast.present();
    this.currentToast = toast;

    await toast.onDidDismiss();
    this.currentToast = null;
  }
}

export type ToastPosition = 'bottom' | 'top' | 'middle' | undefined;
