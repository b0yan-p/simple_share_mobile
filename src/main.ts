import { bootstrapApplication } from '@angular/platform-browser';
import {
  PreloadAllModules,
  RouteReuseStrategy,
  provideRouter,
  withPreloading,
} from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';

import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { inject, provideAppInitializer } from '@angular/core';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { AuthBootstrapService } from './app/auth/services/auth-bootstrap.service';
import { authInterceptor } from './app/core/interceptors/auth-interceptor.interceptor';
import { SimpleShareIdbService } from './app/core/services/simpleshare-idb.service';

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    // Only the chevron in headers: on iOS Ionic defaults the back button label
    // to "Back", which does not belong in this design.
    provideIonicAngular({ backButtonText: '' }),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAppInitializer(() => {
      const boot = inject(AuthBootstrapService);
      return boot.init();
    }),
    provideAppInitializer(() => {
      const idb = inject(SimpleShareIdbService);
      return idb.initialize();
    }),
  ],
});
