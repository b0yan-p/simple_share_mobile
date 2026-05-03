import { NgStyle } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';

export type AvatarColor = {
  bg: string;
  text: string;
};

@Component({
  selector: 'app-avatar',
  standalone: true,
  imports: [NgStyle],
  templateUrl: './avatar.component.html',
  styleUrl: './avatar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvatarComponent implements OnChanges {
  @Input() name: string = '';
  @Input({ required: true }) src: string | null | undefined = null;

  @Input() size: number = 40;
  @Input() round: boolean = true;
  @Input() maxInitials: number = 2;
  @Input() colorKey: string | number | null | undefined = null;

  @Input() colors: AvatarColor[] = [
    { bg: '#E1F6EF', text: '#386F61' },
    { bg: '#EEEDFF', text: '#484091' },
    { bg: '#FAEDE7', text: '#9F6B59' },
    { bg: '#FAEFDA', text: '#86613B' },
  ];

  imageFailed = false;

  initials = '?';

  selectedColor: AvatarColor = {
    bg: '#191a1f',
    text: '#ffffff',
  };

  avatarStyles: Record<string, string> = {};

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['src']) {
      this.imageFailed = false;
    }

    this.initials = this.resolveInitials();
    this.selectedColor = this.resolveColor();
    this.avatarStyles = this.resolveStyles();
  }

  get shouldShowImage(): boolean {
    return !!this.src && !this.imageFailed;
  }

  onImageError(): void {
    this.imageFailed = true;
  }

  private resolveInitials(): string {
    const value = this.name?.trim();

    if (!value) {
      return '?';
    }

    const words = value.split(/\s+/).filter(Boolean);

    if (words.length === 1) {
      return words[0].slice(0, this.maxInitials).toUpperCase();
    }

    return words
      .slice(0, this.maxInitials)
      .map((word) => word[0])
      .join('')
      .toUpperCase();
  }

  private resolveColor(): AvatarColor {
    if (!this.colors?.length) {
      return {
        bg: '#191a1f',
        text: '#ffffff',
      };
    }

    const key = this.colorKey?.toString().trim() || this.name?.trim() || this.initials;

    const hash = this.hashString(key);
    const index = hash % this.colors.length;

    return this.colors[index];
  }

  private resolveStyles(): Record<string, string> {
    const size = Number(this.size) || 40;

    return {
      width: `${size}px`,
      height: `${size}px`,
      'border-radius': this.round ? '50%' : '12px',
      'background-color': this.selectedColor.bg,
      color: this.selectedColor.text,
      'font-size': `${Math.max(size * 0.38, 12)}px`,
    };
  }

  private hashString(value: string): number {
    let hash = 2166136261;

    for (let i = 0; i < value.length; i++) {
      hash ^= value.charCodeAt(i);
      hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
    }

    return Math.abs(hash >>> 0);
  }
}
