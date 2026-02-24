import { NgStyle } from '@angular/common';
import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-avatar',
  templateUrl: './avatar.component.html',
  styleUrls: ['./avatar.component.scss'],
  imports: [NgStyle],
})
export class AvatarComponent {
  private svgPath = 'assets/icons/svg/';

  icon = input.required<string>();
  alt = input.required<string>();

  width = input<number>(42);

  iconPath = computed(() => `${this.svgPath}${this.icon()}.svg`);
  widthInPx = computed(() => `${this.width()}px`);
}
