import { Component, input, output } from '@angular/core';
import { IonSpinner } from '@ionic/angular/standalone';

/**
 * Google's own sign-in button, markup and styling taken verbatim from their
 * branding guidelines - review rejects anything that deviates from it. Pages
 * only control the width, through the host element.
 */
@Component({
  selector: 'app-google-sign-in-button',
  templateUrl: './google-sign-in-button.component.html',
  styleUrls: ['./google-sign-in-button.component.scss'],
  imports: [IonSpinner],
  host: {
    '[class.theme-light]': "theme() === 'light'",
  },
})
export class GoogleSignInButtonComponent {
  /** Google's two approved faces: grey ('neutral') and white ('light'). */
  readonly theme = input<'neutral' | 'light'>('neutral');

  readonly loading = input(false);
  readonly disabled = input(false);

  readonly pressed = output<void>();
}
