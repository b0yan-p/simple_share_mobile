# simpleShare — mobilna aplikacija

Angular 20 (standalone) + Ionic 8 + Capacitor 8. Podržana platforma je Android;
`ios/` folder ne postoji.

## Šta ti treba

| Alat        | Verzija           | Napomena                                          |
| ----------- | ----------------- | ------------------------------------------------- |
| Node        | **dvije verzije** | vidi upozorenje ispod                             |
| JDK         | 17                | Temurin 17 je testiran                            |
| Android SDK | —                 | `ANDROID_SDK_ROOT` (npr. `~/Library/Android/sdk`) |
| adb         | iz Android SDK-a  | za instalaciju i provjeru linkova                 |

> **Zamka sa Node verzijom.** Angular radi na Node 20, a **Capacitor CLI traži
> Node ≥ 22**. Sa Node 20 svaka `npx cap ...` komanda pukne sa
> `The Capacitor CLI requires NodeJS >=22.0.0`.
>
> Rješenje je da za `cap` komande privremeno prebaciš verziju:
>
> ```bash
> nvm use 22          # ili: export PATH="$HOME/.nvm/versions/node/v22.23.2/bin:$PATH"
> npx cap sync android
> nvm use 20          # nazad za ng komande
> ```

Instalacija zavisnosti:

```bash
npm ci
```

## Razvoj u browseru

```bash
npm start        # ng serve -> http://localhost:4200
```

Koristi `src/environments/environment.ts`: API na `http://localhost:5169/api`,
pa backend mora biti pokrenut lokalno.

Invite flow se **može cijeli proklikati u browseru** — link koji generiše invite
ekran vodi na `http://localhost:4200/join/<token>`, i ta ruta radi na dev
serveru. Deep link se, naravno, ne može testirati ovdje.

## Konfiguracija po buildu

|                | `environment.ts` (dev)      | `environment.prod.ts` (produkcija)         |
| -------------- | --------------------------- | ------------------------------------------ |
| API            | `http://localhost:5169/api` | `https://simpleshare-api.choxster.com/api` |
| Invite linkovi | `http://localhost:4200`     | `https://simpleshare-api.choxster.com`     |

`ng build` **već po default-u koristi produkcijsku konfiguraciju** — u
`angular.json` build target ima `"defaultConfiguration": "production"`. Do
Angulara 11 je bilo obrnuto (`ng build` je bio dev, trebalo je `--prod`), pa
stariji tutorijali navode drugačije.

Komande niže ipak pišu `--configuration production` **eksplicitno**. Ako neko
ukloni onaj `defaultConfiguration` iz `angular.json`, `ng build` tiho postane
dev build i APK počne gađati `localhost` — bez greške i bez upozorenja.

Za dev build namjerno: `npx ng build --configuration development`.

## Debug APK

Dvije putanje — prva instalira na telefon, druga proizvodi fajl.

### A) Build i instalacija na povezan telefon

Najkraći put kad ti treba aplikacija na uređaju:

```bash
npx ng build --configuration production   # produkcijski env (API + invite URL)
nvm use 22
npx cap sync android      # kopira www/ u Android projekat + registruje plugine
npx cap run android       # buildu je i instalira na uređaj
nvm use 20
```

`cap run android` ponudi listu uređaja ako ih je više. Provjeri da je uređaj
vidljiv:

```bash
adb devices
```

### B) Samo APK fajl

Kad ti treba APK da ga nekome pošalješ:

```bash
npx ng build --configuration production   # produkcijski env (API + invite URL)
nvm use 22 && npx cap sync android && nvm use 20
cd android
./gradlew assembleDebug
```

APK završi na:

```
android/app/build/outputs/apk/debug/app-debug.apk
```

Instalacija ručno:

```bash
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

> **`cap sync` prije svakog Android builda.** Gradle pakuje ono što je u
> `android/app/src/main/assets/public`, a tamo dolazi samo kroz `cap sync`. Bez
> toga dobiješ APK sa starim web kodom, bez ikakve greške.

## Deep linkovi (invite linkovi)

Aplikacija je registrovana kao handler za `https://simpleshare-api.choxster.com/join/*`
(`android/app/src/main/AndroidManifest.xml`). Kad Android potvrdi domen, invite
link se otvara u aplikaciji umjesto u browseru.

### Prije testiranja

1. **Backend mora biti deployovan prvo.** Android provjeru radi **jednom, pri
   instalaciji** — čita `https://simpleshare-api.choxster.com/.well-known/assetlinks.json`.
   Ako tada backend nije bio gore, provjera padne i **ne ponavlja se sama**.
2. **Obriši staru aplikaciju.** `appId` je promijenjen sa `io.ionic.starter` na
   `com.choxster.simpleshare`, pa Android novu instalira kao odvojenu aplikaciju
   — dvije ikone, i stara može presresti link.

### Provjera

```bash
adb shell pm get-app-links com.choxster.simpleshare
```

Pored domena treba da piše `verified`. Ako ne piše, forsiraj ponovnu provjeru:

```bash
adb shell pm verify-app-links --re-verify com.choxster.simpleshare
```

Simulacija otvaranja linka:

```bash
adb shell am start -a android.intent.action.VIEW \
  -d "https://simpleshare-api.choxster.com/join/<token>"
```

Ručno: uzmi `Copy link` u aplikaciji, pošalji sebi (Viber, notes, bilo šta) i
**tapni link odatle**. Kucanje URL-a u adresnu liniju browsera ne prolazi kroz
mehanizam za linkove, pa nije validan test.

### Zašto Play Store build (još) ne radi

`AppLinks:AndroidSha256Fingerprints` u backend konfiguraciji (`appsettings.json`)
sadrži **samo debug potpis** sa razvojne mašine. Zato:

- aplikacija instalirana odavde (`cap run android`, `assembleDebug`) — **radi**
- APK potpisan za Play Store — **ne radi** dok se ne doda i taj potpis

Potpis se uzima iz Play Console → App integrity → App signing i dopiše u istu
listu. Oba potpisa tamo stoje istovremeno, to je normalno i očekivano.

Debug potpis lokalne mašine:

```bash
keytool -list -v -keystore ~/.android/debug.keystore \
  -alias androiddebugkey -storepass android | grep SHA256
```

Ako neko drugi buildu-je debug APK na svojoj mašini, njegov debug potpis je
**drugačiji** i deep linkovi mu neće raditi dok se i on ne doda u listu.

## Ostale komande

```bash
npm run lint           # ESLint (8 postojećih greški je pre-existing)
npm run format         # Prettier
npm run format:check
npm run build          # produkcijski web build u www/
```
