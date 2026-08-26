import { NgStyle } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { IonIcon } from '@ionic/angular/standalone';

@Component({
  selector: 'app-empty-state',
  templateUrl: './empty-state.component.html',
  styleUrls: ['./empty-state.component.scss'],
  imports: [IonIcon, NgStyle],
})
export class EmptyStateComponent {
  icon = input<string>('information-circle-outline');
  title = input.required<string>();
  subtitle = input<string>();
  actionLabel = input<string>();

  imgSrc = input<string | undefined | null>(undefined);
  imgWidth = input<string>('168px');

  action = output<void>();
}
