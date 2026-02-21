import { Component, input } from '@angular/core';

@Component({
  selector: 'app-chip',
  templateUrl: './chip.component.html',
  styleUrls: ['./chip.component.scss'],
  host: {
    '[class]': 'severity()',
    '[class.rounded]': 'rounded()',
  },
})
export class ChipComponent {
  title = input.required<string>();

  severity = input<'success' | 'error'>('success');
  rounded = input<boolean>(true);
}
