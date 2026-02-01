import { inject, Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular';

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private toastController = inject(ToastController);

  private currentToast: HTMLIonToastElement | null = null;
  protected position: ToastPosition = 'bottom';
  protected toastDuration = 5000;

  public async successToast(
    message: string,
    duration: number = this.toastDuration,
    color = 'success',
  ) {
    await this.showToast(message, duration, color);
  }

  public async errorToast(
    message: string,
    duration: number = this.toastDuration,
    color = 'danger',
  ) {
    await this.showToast(message, duration, color);
  }

  public async warnToast(
    message: string,
    duration: number = this.toastDuration,
    color = 'warning',
  ) {
    await this.showToast(message, duration, color);
  }

  public async infoToast(
    message: string,
    duration: number = this.toastDuration,
    color = 'tertiary',
  ) {
    await this.showToast(message, duration, color);
  }

  protected async showToast(message: string, duration = this.toastDuration, color?: string) {
    if (!!this.currentToast) {
      await this.currentToast.dismiss();
    }

    const toast = await this.toastController.create({
      message,
      duration,
      color,
      position: this.position,
      animated: true,
      swipeGesture: 'vertical',
      cssClass: 'custom-toast',
    });

    await toast.present();
    this.currentToast = toast;

    await toast.onDidDismiss();
    this.currentToast = null;
  }
}

export type ToastPosition = 'bottom' | 'top' | 'middle' | undefined;
