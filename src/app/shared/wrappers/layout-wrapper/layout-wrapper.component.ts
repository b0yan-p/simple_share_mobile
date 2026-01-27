import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IonIcon, IonTabBar, IonTabButton, IonTabs } from '@ionic/angular/standalone';
import { TabItem, TabItems } from '../tab-items.model';

@Component({
  selector: 'app-layout-wrapper',
  templateUrl: './layout-wrapper.component.html',
  styleUrls: ['./layout-wrapper.component.scss'],
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, RouterModule],
})
export class LayoutWrapperComponent {
  tabItems: TabItem[] = TabItems;
}
