import { TitleCasePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IonIcon, IonLabel, IonTabBar, IonTabButton, IonTabs } from '@ionic/angular/standalone';
import { UiService } from '../../../core/services/ui.service';
import { TabItem, TabItems } from '../tab-items.model';

@Component({
  selector: 'app-layout-wrapper',
  templateUrl: './layout-wrapper.component.html',
  styleUrls: ['./layout-wrapper.component.scss'],
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, RouterModule, TitleCasePipe],
})
export class LayoutWrapperComponent {
  readonly uiService = inject(UiService);
  tabItems: TabItem[] = TabItems;
}
