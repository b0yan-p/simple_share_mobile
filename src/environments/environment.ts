// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  baseAPIUrl: 'http://localhost:5169/api',
  clientUrl: 'http://localhost:4200',

  // Web OAuth client id - the audience the backend accepts. Not a secret: an
  // idToken is worthless until the backend validates it.
  googleClientId: '414539377468-0h230vr1k6ul4no49jjlelevs0enkvh4.apps.googleusercontent.com',

  // baseAPIUrl: 'https://api.shareorb.app/api',
  // clientUrl: 'https://api.shareorb.app',
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
