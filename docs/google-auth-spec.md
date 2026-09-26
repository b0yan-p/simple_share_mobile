# Google Sign-In — mobilna aplikacija

Status: **radi end-to-end** — potvrđeno na uređaju 2026-09-26: Google dijalog → `idToken` →
`POST /api/Auth/google` → SimpleShare JWT u secure storage-u.
Par: [`simpleShare_backend/docs/google-auth-spec.md`](../../simpleShare_backend/docs/google-auth-spec.md)

Google je **jedini način prijave** u aplikaciju. Native Google dijalog vraća `idToken`, aplikacija
ga šalje backendu i dobija `LoginUser` — isti DTO koji je ranije vraćao i klasični login.
Prijava lozinkom i registracija su uklonjene iz aplikacije; login ekran je samo jedno dugme.

---

## 0. Kako integracija radi

### 0.1 Ko s kim razgovara

```
1. Mobilna  →  Google         "ko je korisnik na ovom uređaju?"
2. Google   →  Mobilna         idToken — JWT potpisan Google-ovim privatnim ključem
3. Mobilna  →  SimpleShare     POST /api/Auth/google  { idToken }
4. Backend                     provjeri potpis Google-ovim javnim ključem (lokalno)
5. Backend  →  Mobilna         LoginUser + SimpleShare JWT
```

**Google kontaktira mobilna, nikad backend.** Google nalog živi na telefonu, u Android
nalog-menadžeru; backend nema pristup tome i nema načina da "pita Google ko je ovaj korisnik".
Identitet dokazuje uređaj na kojem je korisnik već prijavljen — zato dijalog iskače lokalno.

**Backend ne šalje nijedan zahtjev Google-u po prijavi.** `idToken` je samopotvrđujući: backend
jednom skine Google-ove javne ključeve, kešira ih, i dalje provjerava potpis lokalno — isti
princip kojim već validira vlastiti JWT u svakom zahtjevu.

Varijanta u kojoj backend zaista zove Google (razmjena `code`-a uz `CLIENT_SECRET`) je
server-side OAuth za web aplikacije. Za nju postoji rezervisan `redirect_uri`, ali se ne
koristi — nema browser redirecta u native aplikaciji. Detalji u backend specifikaciji, §8.

### 0.2 Tri OAuth klijenta, samo jedan u kodu

Ovo je mjesto gdje se najlakše pogriješi, pa eksplicitno:

| Klijent     | Gdje se koristi                                                           | Pojavljuje se u kodu?                   |
| ----------- | ------------------------------------------------------------------------- | --------------------------------------- |
| **Web**     | `webClientId` u `SocialLogin.initialize()`; backend ga prihvata kao `aud` | **da** — `environment.googleClientId`   |
| **Android** | Google preko njega prepoznaje aplikaciju                                  | **ne** — nigdje                         |
| **iOS**     | isto, na iOS-u                                                            | **ne** — samo URL scheme u `Info.plist` |

Android client ID **nema gdje da se upiše** — Credential Manager ga ne prima kao parametar.
Aplikaciju identifikuje preko para **package name + SHA-1 potpisa** APK-a koji trenutno radi;
taj par mora postojati kao Android OAuth klijent u **istom GCP projektu** kao i Web klijent.
Android klijent je dakle obavezan, ali je nevidljiv za kod.

Praktična posljedica: upisivanje Android client ID-ja u `environment.ts` daje
`[28444] Developer console is not set up correctly` — vidi §11.

### 0.3 Šta se dešava pri prijavi, redom

```
[Login ekran]  → "Continue with Google"
        │
        ▼
GoogleAuthService.signIn()
   ├─ ensureInitialized()      SocialLogin.initialize({ google: { webClientId } })
   │                           jednom po pokretanju aplikacije, čuva se u `initialized`
   ├─ SocialLogin.login()      native dijalog preko Android Credential Manager-a
   └─ result.idToken           union online/offline — čita se kroz type guard
        │
        ▼
AuthService.googleLogin()      POST {baseAPIUrl}/auth/google  { idToken }
        │                      interceptor preskače auth header (SKIP_AUTH)
        ▼
LoginUser                      isti DTO kao kod običnog logina
        │
        ▼
tokenStorage.setUser → setAccessToken       secure storage + signali
        │
        ▼
router.navigateByUrl(returnUrl ?? '/home', { replaceUrl: true })
```

Aplikacija **ne zna niti je zanima** da li je backend uradio login ili registraciju — odgovor
je isti u oba slučaja, pa u `googleLogin()` nema nijednog grananja.

### 0.4 Zašto je plugin izolovan u vlastiti servis

`GoogleAuthService` je jedini fajl koji dodiruje plugin. Dva razloga:

1. **Promise granica.** Plugin je promise-based; ostatak aplikacije je RxJS. `from()` i `defer()`
   stoje ovdje i nigdje drugdje, isto kao što `TokenStorageService` zamotava `SecureStoragePlugin`.
2. **Zamjenjivost.** Ako plugin ode u nepodržano stanje, mijenja se jedan fajl — `AuthService`,
   komponente i interceptor ga ne vide.

### 0.5 Odjava

Dvije odjave, jer postoje dvije sesije:

- **SimpleShare sesija** — `tokenStorage.clearAll()`, briše token i korisnika iz secure storage-a.
- **Google sesija na uređaju** — `SocialLogin.logout()`. Bez nje sljedeći klik na dugme preskače
  biranje naloga i tiho vrati istog korisnika, što izgleda kao da logout nije radio.

Pokreću se **paralelno**, a čeka se samo lokalna — razlog i mjerenja u §5.

---

---

## 2. Plugin i native konfiguracija

### 2.1 Izbor plugina

Preporuka: **`@capgo/capacitor-social-login`** — aktivno održavan, na Androidu koristi
Credential Manager (novi Google API; stari `GoogleSignIn` je deprecated), na iOS-u
`GIDSignIn`, a ima i web implementaciju.

```
npm i @capgo/capacitor-social-login
npx cap sync
```

> **Provjereno:** instalirana je verzija `8.5.11`, peer `@capacitor/core >=8.0.0` — projekat
> je na `8.0.1`. `npx cap sync android` registruje plugin, `./gradlew :app:assembleDebug`
> prolazi.

### 2.2 Google Cloud Console

Potrebna su **tri** OAuth klijenta pod istim projektom:

| Tip klijenta    | Čemu služi                                              | Placeholder                  |
| --------------- | ------------------------------------------------------- | ---------------------------- |
| Web application | `serverClientId` — backend prihvata `aud` ovog klijenta | `<GOOGLE_CLIENT_ID>`         |
| Android         | potpisuje zahtjev sa uređaja                            | `<GOOGLE_ANDROID_CLIENT_ID>` |
| iOS             | potpisuje zahtjev sa uređaja                            | `<GOOGLE_IOS_CLIENT_ID>`     |

U kod ide **isključivo Web client ID** (§0.2). Android i iOS klijenti moraju postojati u
istom projektu, ali se nigdje ne upisuju.

Na **Web** klijentu, pod _Authorized redirect URIs_, upisati:

```
https://api.shareorb.app/api/auth/google/callback
```

Mobilna aplikacija taj URL nigdje ne koristi (native dijalog ne radi HTTP redirect) — stoji
zbog backend §8 i eventualnog web logina. Detalji su u backend specifikaciji.

Android klijent traži:

- package name: `app.shareorb.simpleshare`
- SHA-1 otisak **za svaki keystore**: debug (`~/.android/debug.keystore`) i release. Bez debug
  otiska Google login ne radi na `npx cap run android` buildovima, a greška koja se dobije
  (`10: DEVELOPER_ERROR`) ne kaže zašto.

`<GOOGLE_CLIENT_SECRET>` **ne ide u mobilnu aplikaciju nikad.** Živi samo na backendu.
Frontend nikad ne radi razmjenu koda za token.

### 2.3 `environment.ts` / `environment.prod.ts`

```ts
export const environment = {
  production: false,
  baseAPIUrl: 'http://localhost:5169/api',
  clientUrl: 'http://localhost:4200',

  // Web OAuth client — isti <GOOGLE_CLIENT_ID> koji backend prihvata kao `aud`.
  // Nije tajna: idToken je bezvrijedan bez backend validacije.
  googleClientId: '<GOOGLE_CLIENT_ID>',
};
```

Isti ključ dodati i u `environment.prod.ts`. Vrijednost je ista u oba — Google nema
odvojeni "dev" projekat osim ako se svjesno ne napravi.

### 2.4 Android

**Nije potrebna nikakva izmjena u `strings.xml`.** Plugin uzima `webClientId` isključivo iz
`SocialLogin.initialize()` — provjereno u `GoogleProvider.java`, ne čita nijedan string resurs.
Ni `google-services.json` ni Firebase nisu potrebni.

Kritično je umjesto toga ono što se konfiguriše **van repoa**: u Google Cloud Console mora
postojati **Android** OAuth klijent sa `app.shareorb.simpleshare` i SHA-1 otiskom keystore-a
kojim je build potpisan. Credential Manager ne prima `androidClientId` kao parametar — on
identifikuje aplikaciju preko para package + potpis, pa bez tog klijenta prijava pada sa
`[16] Account reauth failed`, iako je `webClientId` ispravan.

### 2.5 iOS

`ios/App/App/Info.plist` — reversed client ID kao URL scheme:

```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>com.googleusercontent.apps.<GOOGLE_IOS_CLIENT_ID_REVERSED></string>
    </array>
  </dict>
</array>
```

> iOS folder trenutno ne postoji u repou (`android/` postoji, `ios/` ne). Ovaj korak je
> relevantan tek kad se doda iOS platforma — do tada se preskače bez posljedica po Android.

---

## 3. Model zahtjeva

Novi fajl `src/app/auth/models/google-login-input.model.ts`:

```ts
export interface GoogleLoginInput {
  idToken: string;
}
```

`LoginUser` se **ne mijenja.** Nema `GoogleLoginResponse` modela.

---

## 4. `GoogleAuthService` — omotač oko plugina

Novi fajl `src/app/auth/services/google-auth.service.ts`.

Razlog za zaseban servis, a ne poziv plugina direktno iz `AuthService`: plugin je jedini
Promise-based i platform-specific dio ovog feature-a. Izolovan ovdje, `AuthService` ostaje
čist RxJS i zamjena plugina (§2.1) dira jedan fajl.

```ts
@Injectable({ providedIn: 'root' })
export class GoogleAuthService {
  private initialized = false;

  signIn(): Observable<string> {
    return this.ensureInitialized().pipe(
      switchMap(() => from(SocialLogin.login({ provider: 'google', options: {} }))),
      map(({ result }) => {
        // Online mode always returns a payload with an idToken; the offline
        // branch of the union only carries a serverAuthCode, which this app
        // never asks for.
        const idToken = 'idToken' in result ? result.idToken : null;
        if (!idToken) throw new Error('Google returned no idToken');

        return idToken;
      }),
    );
  }

  signOut(): Observable<void> {
    if (!this.initialized) return of(void 0);

    return from(SocialLogin.logout({ provider: 'google' })).pipe(map(() => void 0));
  }

  private ensureInitialized(): Observable<void> {
    if (this.initialized) return of(void 0);

    // defer so initialize() runs on subscribe, not when the pipe is built.
    return defer(() =>
      from(SocialLogin.initialize({ google: { webClientId: environment.googleClientId } })),
    ).pipe(
      map(() => {
        this.initialized = true;
      }),
    );
  }
}

/** Plugin normalises every cancellation path to this code. */
export const isGoogleSignInCancelled = (err: unknown): boolean =>
  (err as { code?: string } | null)?.code === 'USER_CANCELLED';
```

Pravila koja ovaj fajl poštuje:

- **Bez `async`/`await`.** Plugin vraća Promise → `from()`, tačno kao `TokenStorageService`
  radi sa `SecureStoragePlugin`.
- Otkazivanje od strane korisnika je **očekivan ishod**, ne greška za prikazivanje. Plugin
  već normalizuje sve puteve otkazivanja na `code === 'USER_CANCELLED'`, pa nije potrebna
  vlastita klasa greške — dovoljan je `isGoogleSignInCancelled` helper.

---

## 5. `AuthService.googleLogin()`

Izmjena `src/app/auth/services/auth.service.ts` — treća metoda po obrascu prve dvije:

```ts
private googleLoginAPI = `${environment.baseAPIUrl}/auth/google`;

public googleLogin(): Observable<boolean> {
  return this.googleAuth.signIn().pipe(
    switchMap((idToken) =>
      this.http.post<LoginUser>(this.googleLoginAPI, { idToken } as GoogleLoginInput),
    ),
    first(),
    switchMap((res) => this.tokenStorage.setUser(res)),
    switchMap((res) => this.tokenStorage.setAccessToken(res.token)),
    catchError((err) => {
      console.error(err);
      throw err;
    }),
  );
}
```

`GoogleAuthService` se injektuje uz postojeće (`private googleAuth = inject(GoogleAuthService)`).

### `logout()`

Postojeći `logout()` briše samo SimpleShare storage. Bez odjave i sa Google strane, sljedeći
klik na "Continue with Google" preskače biranje naloga i tiho vrati **istog** korisnika — što
izgleda kao da logout nije radio.

Dvije odjave se pokreću **paralelno**, a čeka se samo lokalna:

```ts
public logout() {
  this.googleAuth.signOut().pipe(first(), catchError(() => of(void 0))).subscribe();

  this.tokenStorage.clearAll().pipe(first())
    .subscribe(() => this.router.navigate(['login']));
}
```

Mjereno na uređaju (logcat): `SocialLogin.logout` traje **~3,07 s**, od čega ~3,0 s otpada na
`clearRestoreCredential()` — IPC poziv u Play Services koji briše rezervnu kredencijalu za
prenos na novi uređaj. Brisanje secure storage-a traje **6 ms**. Ulančavanje te dvije radnje
kroz `switchMap` značilo bi da korisnik gleda spinner tri sekunde zbog tuđeg koda, pa se
Google odjava pušta da se dovrši u pozadini. Rizik je uzak prozor u kojem bi gašenje
aplikacije ostavilo Google sesiju živom.

---

## 6. Interceptor

`src/app/core/interceptors/auth-interceptor.interceptor.ts` — dodati u `SKIP_AUTH`:

```ts
const SKIP_AUTH: (string | RegExp)[] = [
  '/auth/google',
  // ...
];
```

**Bez ovoga feature ne radi uopšte.** Interceptor na zahtjev bez tokena zove `logout()` i
puca sa `No token` prije nego što zahtjev ode na mrežu — a Google login je po definiciji
zahtjev bez tokena.

---

## 7. UI

### 7.1 Login (`login.component.html`)

Cijeli šablon — forma sa email/lozinkom je uklonjena:

```html
<ion-content class="ion-padding">
  <div class="bdd-mt-4 bdd-flex bdd-flex-col bdd-gap-2">
    <ion-button fill="outline" [disabled]="loading" (click)="loginWithGoogle()">
      <ion-icon slot="start" name="logo-google" />
      Continue with Google
    </ion-button>
  </div>
</ion-content>
```

`IonIcon` dodati u `imports` komponente i registrovati `logoGoogle` iz `ionicons/icons`
(`addIcons({ logoGoogle })`) — provjeriti kako druge komponente u projektu registruju ikone
i pratiti to, ne uvoditi novi način.

### 7.2 Login (`login.component.ts`)

```ts
loginWithGoogle() {
  if (this.loading) return;

  this.loading = true;
  this.auth.googleLogin().subscribe({
    next: (res) => {
      if (!res) return;
      this.loading = false;
      this.router.navigateByUrl(this.returnUrl ?? '/home', { replaceUrl: true });
    },
    error: (err) => {
      this.loading = false;
      if (isGoogleSignInCancelled(err)) return;   // korisnik odustao, bez poruke
      console.error(err);
    },
  });
}
```

Greška ide kroz `ToastService.errorToast`. Dva vrlo različita kvara stižu u isti `error`
callback i `signInErrorMessage()` ih razdvaja:

- **native dijalog nije uspio** — obična `Error` sa porukom plugina, koja imenuje Google
  konfiguraciju koja ne valja (vidi §11). Prikazuje se doslovno.
- **API je odbio token** — `HttpErrorResponse`; čita se `problem+json` polje `detail`, uz status
  i `traceId` kad postoji, jer je to jedino što spaja poruku sa redom u backend logu.

Otkazivanje dijaloga se filtrira prije svega toga i ne prikazuje ništa.

### 7.3 Prijava lozinkom i registracija

**Uklonjene.** Obrisani su `register.component`, `register-input.model.ts`,
`login-input.model.ts`, `AuthService.register()`, `AuthService.login()`, `/register` ruta i
forma sa login ekrana. Interceptor više ne preskače `/auth/login` ni `/auth/register`, jer ih
aplikacija ne zove.

Backend endpointi `/api/Auth/login` i `/api/Auth/register` i dalje postoje i rade — koriste ih
integracioni testovi (`AUTH-01..07`) — ali ih mobilna aplikacija ne dodiruje. Svaki korisnik,
nov ili postojeći, ulazi kroz `POST /api/Auth/google`.

---

## 8. Rubni slučajevi

| Slučaj                                                        | Ponašanje                                                                                                            |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Korisnik zatvori Google dijalog                               | `loading = false`, nikakva poruka. Otkazivanje nije greška.                                                          |
| Nema mreže                                                    | HTTP greška iz `googleLogin()`; `loading = false`, `console.error`. Pratiti postojeći obrazac login ekrana.          |
| Backend vrati `400 google_token_invalid`                      | Isti put kao i svaka druga HTTP greška. Poruka iz `problem+json` polja `detail` ako se uvede toast.                  |
| Backend vrati `400 google_email_unverified`                   | Isto — jedina poruka koju vrijedi posebno prikazati jer je korisnik može riješiti (verifikovati email kod Google-a). |
| Google nalog čiji email već ima SimpleShare nalog sa lozinkom | Backend ih spaja i vraća `200`. Frontend ne radi ništa posebno — obični login.                                       |
| `DEVELOPER_ERROR` / `10` na Androidu                          | Uvijek konfiguracija, ne kod: SHA-1 otisak nije upisan u Google Console za taj keystore. Vidi §2.2.                  |
| Korisnik već ulogovan pa otvori `/login`                      | `guestGuard` ga vraća na `/home` — postojeće ponašanje, Google dugme ga ne mijenja.                                  |

### Postojeće ponašanje koje ovaj feature ne mijenja (ali vrijedi znati)

`logout()` briše secure storage, ali **ne prazni IndexedDB keš** (`SimpleShareIdbService`).
Ako se na istom uređaju odjavi jedan korisnik pa prijavi drugi — preko Google-a ili lozinkom,
svejedno — drugi vidi keširane podatke prvog dok se lista ne osvježi sa servera. Ovo je
postojeći problem oba postojeća toka i **nije dio ovog taska**; rješava se na jednom mjestu
u `logout()`-u, za sve načine prijave odjednom.

---

## 9. Lista izmjena

| #   | Fajl                                                        | Akcija                                                |
| --- | ----------------------------------------------------------- | ----------------------------------------------------- |
| 1   | `package.json`                                              | `@capgo/capacitor-social-login@^8.5.11` — **urađeno** |
| 2   | `src/environments/environment.ts` + `.prod.ts`              | `googleClientId: '<GOOGLE_CLIENT_ID>'`                |
| 3   | `android/app/src/main/res/values/strings.xml`               | `server_client_id`                                    |
| 4   | `ios/App/App/Info.plist`                                    | URL scheme — **tek kad se doda iOS platforma**        |
| 5   | `src/app/auth/models/google-login-input.model.ts`           | **novo** — `{ idToken }`                              |
| 6   | `src/app/auth/services/google-auth.service.ts`              | **novo** — omotač plugina + `isGoogleSignInCancelled` |
| 7   | `src/app/auth/services/auth.service.ts`                     | **izmjena** — `googleLogin()`, dopunjen `logout()`    |
| 8   | `src/app/core/interceptors/auth-interceptor.interceptor.ts` | **izmjena** — `/auth/google` u `SKIP_AUTH`            |
| 9   | `src/app/auth/pages/login/login.component.{ts,html}`        | **izmjena** — dugme + `loginWithGoogle()`             |
| 10  | `src/app/auth/pages/register/**`, `register-input.model.ts` | **obrisano** — registracija lozinkom izbačena         |
| 11  | `src/app/app.routes.ts`                                     | **izmjena** — `/register` ruta uklonjena              |

`login-user.model.ts`, `token-storage.service.ts` i `auth-bootstrap.service.ts` se **ne diraju**.

---

## 10. Provjera (ručno, na uređaju)

Google login se ne može testirati u browseru na `ng serve` — traži native sloj. Provjera ide
na Android uređaju/emulatoru sa Google Play servisima, `npx cap run android`:

| #   | Korak                                                              | Očekivano                                                                          |
| --- | ------------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| 1   | Novi Google nalog, "Continue with Google"                          | Ulazak na `/home`, korisnik kreiran na backendu                                    |
| 2   | Logout pa ponovo Google login                                      | Google **pita koji nalog** (potvrda da `signOut()` radi); ulazak kao isti korisnik |
| 3   | Zatvoriti Google dijalog                                           | Povratak na login ekran, dugmad ponovo aktivna, bez poruke o grešci                |
| 4   | Google nalog sa emailom koji već ima SimpleShare nalog sa lozinkom | Ulazak na **isti** nalog — iste grupe i troškovi                                   |
| 5   | Otvoriti invite link kao neulogovan pa Google login                | Nakon prijave ide na `join/{token}`, ne na `/home` (`returnUrl`)                   |
| 6   | Avionski mod pa Google login                                       | Greška, `loading` se gasi, ekran ostaje upotrebljiv                                |
| 7   | Release build (`--prod`)                                           | Radi — potvrđuje da je i release SHA-1 upisan u Google Console                     |

Automatizovanih testova nema: u `simpleShareMobile` se `*.spec.ts` fajlovi ne pišu.

**Stanje na 2026-09-26:** korak 1 je potvrđen na uređaju — Google prijava prolazi cijeli lanac
i backend izdaje SimpleShare JWT. Koraci 2–7 još nisu prošli. Konkretno, preusmjeravanje
odjave iz §5 je u kodu ali **nije potvrđeno na uređaju**: posljednje mjerenje pokazalo je da
telefon još izvršava stariji bundle (vidi posljednji pasus §11).

---

## 11. Dijagnostika na Androidu

Sve greške ispod dešavaju se u **koraku 1** iz §0.1 — na uređaju, prije nego što zahtjev
uopšte krene ka backendu. Backend tu nije u igri.

### Gdje su podaci

Plugin pri svakoj prijavi loguje identitet aplikacije pod tagom `GoogleProvider`:

```
adb logcat -c                                  # očisti buffer, pa pokušaj prijavu
adb logcat -d | grep GoogleProvider
```

```
Google login: package=app.shareorb.simpleshare signingSha1=54:DB:… webClientId=…  mode=ONLINE
```

`signingSha1` je **očitan iz APK-a koji trenutno radi na telefonu** — to je konačna istina o
tome čime je build potpisan, ne pretpostavka iz keystore fajla. Taj otisak mora stajati na
Android OAuth klijentu, znak za znak.

`webClientId` je u logu **namjerno skraćen**. Punu vrijednost koju aplikacija stvarno izvršava
daje bundle sa dev servera:

```
adb shell "curl -s http://127.0.0.1:8100/<chunk>.js" | grep -oE '[0-9]+-[a-z0-9]+\.apps\.googleusercontent\.com'
```

### Kako provjeriti tip client ID-ja bez Console-a

Web klijent na Google-ovom authorization endpointu vraća stranicu za prijavu; Android klijent
vraća `Error 400: redirect_uri_mismatch`, jer Android klijenti nemaju redirect URI-jeve:

```
curl -s -L -G "https://accounts.google.com/o/oauth2/v2/auth" \
  --data-urlencode "client_id=<ID>" \
  --data-urlencode "response_type=code" \
  --data-urlencode "scope=openid email" \
  --data-urlencode "redirect_uri=https://api.shareorb.app/api/auth/google/callback" \
  | grep -oE "signin/identifier|redirect_uri_mismatch|Access blocked"
```

`signin/identifier` → Web klijent, ispravan. `redirect_uri_mismatch` → nije Web klijent.
Isti poziv usput potvrđuje da je redirect URI registrovan.

### Katalog grešaka

| Greška                                              | Značenje                             | Uzrok                                                                                                                                                                 |
| --------------------------------------------------- | ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `[28444] Developer console is not set up correctly` | Google ne prepoznaje ovu instalaciju | U `environment.ts` je Android umjesto Web client ID-ja; ili Android klijent ne postoji, ili je u drugom projektu, ili mu se SHA-1 ne poklapa sa `signingSha1` iz loga |
| `[16] Account reauth failed`                        | Nalog odbijen                        | Consent screen u _Testing_ modu a nalog nije test user; ili _Internal_ uz lični Gmail                                                                                 |
| `[28448] Unsupported API`                           | **nije greška**                      | Google-ov `GoogleIdService` je vraća pri `clearCredentialState()`; framework svejedno završi uredno                                                                   |
| Kartica za izbor naloga iskoči **dvaput**           | **nije bug**                         | Plugin nakon prvog pada očisti Credential Manager stanje i pokuša još jednom; drugi pad je onaj koji stiže u JS                                                       |

Izmjene u Google Console-u ne djeluju odmah — obično par minuta, dokumentacija pominje i duže.

### Kad se mijenja kod, a ponašanje ostaje isto

Potvrditi da uređaj izvršava novi bundle prije nego što se zaključuje bilo šta. Redoslijed
poziva u `adb logcat` pokazuje koja verzija radi — npr. da li `SecureStoragePlugin.clear`
kreće prije ili poslije `Cleared restore credential successfully!` (§5).
