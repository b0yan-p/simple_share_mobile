import { Directive, HostListener } from '@angular/core';

@Directive({ selector: 'form[appAdvanceInput]' })
export class AdvanceInputDirective {
  @HostListener('keydown.enter', ['$event'])
  advanceInput(event: Event): void {
    if (
      !(event instanceof KeyboardEvent) ||
      event.isComposing ||
      !(event.target instanceof Element)
    )
      return;
    const field = event.target.closest('ion-input');
    const form = event.currentTarget;
    if (!field || !(form instanceof HTMLFormElement)) return;

    const fields = Array.from(form.querySelectorAll('ion-input'));
    const next = fields[fields.indexOf(field) + 1];
    event.preventDefault();
    if (next) {
      void next.setFocus();
    } else {
      form.requestSubmit();
    }
  }
}
