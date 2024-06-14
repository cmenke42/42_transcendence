import { ApplicationConfig, NgModule, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withInterceptors, withXsrfConfiguration } from '@angular/common/http';
import { JwtModule } from '@auth0/angular-jwt';
import { authInterceptor } from './helper/auth.interceptor';
// import { AuthInterceptor } from '../../../_help/auth.interceptor';
// import { customInterceptor } from './helper/custom.interceptor';
// import { MatSlideToggleModule } from '@angular/material/slide-toggle';

// @NgModule({
//   imports: [
//     MatSlideToggleModule,
//   ]
// })

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimationsAsync(),
    provideHttpClient(
      withXsrfConfiguration({
        cookieName: 'csrftoken',
        headerName: 'X-CSRFToken',
      }),
      withInterceptors([authInterceptor]),
    ),
    importProvidersFrom([
      JwtModule.forRoot({
        config: {
          tokenGetter: () => localStorage.getItem('access_token')
        }
      })
    ]),
  ]
};
