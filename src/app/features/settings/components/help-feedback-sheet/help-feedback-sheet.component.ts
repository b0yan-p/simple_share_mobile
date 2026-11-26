import { Component, signal } from '@angular/core';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  bugOutline,
  bulbOutline,
  chatbubbleEllipsesOutline,
  chevronForwardOutline,
  closeOutline,
} from 'ionicons/icons';

type FeedbackType = 'bug' | 'feature' | 'support';

@Component({
  selector: 'app-help-feedback-sheet',
  templateUrl: './help-feedback-sheet.component.html',
  styleUrl: './help-feedback-sheet.component.scss',
  imports: [
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonModal,
    IonTitle,
    IonToolbar,
  ],
})
export class HelpFeedbackSheetComponent {
  protected readonly isOpen = signal(false);

  constructor() {
    addIcons({
      bugOutline,
      bulbOutline,
      chatbubbleEllipsesOutline,
      chevronForwardOutline,
      closeOutline,
    });
  }

  open(): void {
    this.isOpen.set(true);
  }

  protected close(): void {
    this.isOpen.set(false);
  }

  protected composeEmail(type: FeedbackType): void {
    const subject = {
      bug: 'ShareOrb bug report',
      feature: 'ShareOrb feature suggestion',
      support: 'ShareOrb support request',
    }[type];

    let body: string;
    if (type === 'bug') {
      body = [
        'Hi ShareOrb team,',
        '',
        "I've encountered an issue while using ShareOrb.",
        '',
        'What happened?',
        '[Describe the problem]',
        '',
        'What did you expect to happen?',
        '[Describe the expected behavior]',
        '',
        'Steps to reproduce (optional):',
        '[How can we reproduce this issue?]',
      ].join('\n');
    } else if (type === 'feature') {
      body = [
        'Hi ShareOrb team,',
        '',
        'I have an idea that could make ShareOrb even better!',
        '',
        'My suggestion:',
        '[Describe your idea]',
        '',
        'How would this help you? (optional)',
        '[Explain how this feature would improve your experience]',
        '',
        'Thanks for considering my suggestion!',
      ].join('\n');
    } else {
      body = [
        'Hi ShareOrb team,',
        '',
        'I need some help with ShareOrb.',
        '',
        'My question or issue:',
        '[Describe what you need help with]',
        '',
        'Thanks!',
      ].join('\n');
    }

    this.close();
    window.location.href = `mailto:support@shareorb.app?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }
}
