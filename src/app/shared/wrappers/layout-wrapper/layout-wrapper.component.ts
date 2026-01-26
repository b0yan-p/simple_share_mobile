import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {
  IonIcon,
  IonTabBar,
  IonTabButton,
  IonTabs,
  IonTab,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonRouterOutlet,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { home, homeOutline, people, pulse, settings, wallet } from 'ionicons/icons';

@Component({
  selector: 'app-layout-wrapper',
  templateUrl: './layout-wrapper.component.html',
  styleUrls: ['./layout-wrapper.component.scss'],
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonRouterOutlet],
})
export class LayoutWrapperComponent implements OnInit {
  constructor() {
    addIcons({ home, homeOutline, wallet, pulse, people, settings });
  }

  ngOnInit() {}
}
