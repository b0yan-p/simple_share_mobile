import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'timeAgo',
  pure: true,
})
export class TimeAgoPipe implements PipeTransform {
  transform(value: string | Date | number): unknown {
    if (!value) return '';

    const date = new Date(value);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    // Handle future date or small time difference
    if (seconds < 60) return 'just now';

    const intervals: { [key: string]: number } = {
      year: 31536000,
      month: 2592000,
      week: 604800,
      day: 86400,
      hour: 3600,
      minute: 60,
    };

    // Logic for Today/Yesterday
    const diffDays = Math.floor(seconds / 86400);
    if (diffDays === 0) return 'today';
    if (diffDays === 1) return 'yesterday';

    // For the rest use standard format
    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
      const counter = Math.floor(seconds / secondsInUnit);
      if (counter > 0) {
        return `${counter} ${unit}${counter > 1 ? 's' : ''} ago`;
      }
    }

    return date.toDateString();
  }
}
