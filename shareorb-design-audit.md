# ShareOrb mobile application: visual identity and design system audit

**Scope:** Read-only review of the Angular/Ionic source, declared styles, referenced images, package configuration and native app icon inputs. Values below are taken from code as checked in; gradients, alpha colors, runtime Ionic behavior and asset appearance are described where they cannot be reduced to one opaque hex value. No application source was changed to prepare this report.

**Evidence labels:** **Code-confirmed** means a declaration, asset reference or configuration was found in source. **Inference** means a visual role inferred from how the source uses it. **Recommendation** is a proposal for an Astro marketing site, not an existing app rule. **Unverified** means the code or asset set does not establish the fact.

## Executive findings

The in-app product interface is a light, mobile-first finance tool using pale lavender backgrounds, white rounded cards, dark indigo headings, muted violet body copy, and a vivid purple primary action. Teal and coral encode positive and negative balances. The welcome screen deliberately layers a cinematic sunset illustration and deep indigo-to-purple fade behind a friendly planet mascot. Verification and offline states repeat the planet, stars, and cloud imagery. Together these create a distinctive “friendly personal finance in a small cosmos” direction.

There is no standalone brand guide or official declaration of brand colors in the reviewed repository. A source comment calls `#534ab7` the primary and the icon generator calls its violet gradient the brand gradient; these are evidence of intended app branding, not an independently verified official brand standard. The auth templates render **SimpleShare** as their wordmark even though the task name, app ID and website domain use **ShareOrb**. The installed-icon generator uses `logo.png`, while the supplied launcher art is older/simpler planet artwork. Confirm which product name and mascot version the public site should use before finalizing its logo/header.

## 1. Color inventory

### Declared product palette

All values in this table are explicit SCSS definitions in [`src/theme/_palette.scss`](src/theme/_palette.scss#L1). Hex is the authored value; RGB is its direct conversion. CSS custom properties defined in [`src/theme/_theme.light.scss`](src/theme/_theme.light.scss#L1) map these raw colors to Ionic and `--ss-*` semantic names. The documented background RGB in that file (`240, 238, 249`) does **not** equal the palette background `#f7f6fb` (`247,246,251`); the custom property resolves to the hex color and the RGB comment/value can be stale where Ionic consumes the RGB channel.

| Role / status | Palette token | Exact value (HEX; RGB) | CSS variable / actual purpose |
|---|---|---|---|
| Primary purple, declared theme | `$lp-purple-600` | `#534ab7`; 83, 74, 183 | `--ss-primary`, `--ion-color-primary`; main action, selected nav, links, focus and detail icons |
| Primary hover / shade | `$lp-purple-800` | `#3c3489`; 60, 52, 137 | `--ss-primary-hover`, `--ion-color-primary-shade`; hover/pressed states |
| Primary tint | `$lp-purple-200` | `#afa9ec`; 175, 169, 236 | `--ion-color-primary-tint`, `--ss-text-disabled`; disabled text and tint |
| Primary subtle/border tint | `$lp-purple-50` | `#eeedfe`; 238, 237, 254 | `--ss-primary-subtle`, `--ss-surface-subtle`, `--ss-tint-purple`, `--ss-primary-border`, `--ion-color-medium`; subtle fills and outlines |
| Primary light border | `$lp-purple-100` | `#cecbf6`; 206, 203, 246 | `--ss-primary-border`, input border |
| Positive pale | `$lp-teal-50` | `#e1f5ee`; 225, 245, 238 | `--ss-positive-bg`, `--ss-tint-teal`; balance/status background |
| Positive muted | `$lp-teal-400` | `#1d9e75`; 29, 158, 117 | `--ss-positive-muted`, `--ss-positive-border`; chart/legend and muted positive state |
| Positive strong | `$lp-teal-600` | `#0f6e56`; 15, 110, 86 | `--ss-positive`; readable positive amounts and status text |
| Positive darkest | `$lp-teal-800` | `#085041`; 8, 80, 65 | Palette-defined; no confirmed semantic variable or current component use |
| Negative pale | `$lp-coral-50` | `#faece7`; 250, 236, 231 | `--ss-negative-bg`, `--ss-tint-coral`; negative/error fills |
| Negative mid | `$lp-coral-200` | `#f0997b`; 240, 153, 123 | `--ss-negative-muted`, `--ss-negative-border` |
| Negative strong | `$lp-coral-600` | `#993c1d`; 153, 60, 29 | `--ss-negative`, `--ion-color-danger`; debt/error text and destructive actions |
| Negative darkest | `$lp-coral-800` | `#712b13`; 113, 43, 19 | Palette-defined; no confirmed semantic variable or current component use |
| Main app background | `$lp-bg` | `#f7f6fb`; 247, 246, 251 | `--ss-bg`, `--ion-background-color`; default light page and sheet backdrop |
| Card / raised surface | `$lp-surface` | `#ffffff`; 255, 255, 255 | `--ss-surface`, Ionic toolbar/card/tab surfaces; cards, inputs, sheets |
| Selected surface | `$lp-surface-selected` | `#faf9ff`; 250, 249, 255 | `--ss-surface-selected`; selected rows and active treatment |
| Heading ink | `$lp-text-heading` | `#1a1640`; 26, 22, 64 | `--ss-text-heading`, `--ion-text-color`; headings and key values |
| Body text | `$lp-text-body` | `#6b6993`; 107, 105, 147 | `--ss-text`, Ionic tab text; body copy and secondary content |
| Placeholder | `$lp-text-placeholder` | `#8583b0`; 133, 131, 176 | `--ss-text-placeholder`; input hint text |
| On-primary text | `$lp-text-on-dark` | `#ffffff`; 255, 255, 255 | `--ss-primary-fg`, `--ss-text-on-primary`; text on primary fills |
| Card border | `$lp-border-card` | `#e8e4f8`; 232, 228, 248 | `--ss-border`, item border; hairlines and card outlines |
| Input border | `$lp-border-input` | `#cecbf6`; 206, 203, 246 | `--ss-border-input`; input outline and inactive toggles |
| Amber category tint | `$lp-tint-amber` | `#faeeda`; 250, 238, 218 | `--ss-tint-amber`, warning background; light status fill |
| Pink category tint | `$lp-tint-pink` | `#fbeaf0`; 251, 234, 240 | `--ss-tint-pink`; palette-defined; current use not confirmed |
| Warning | `$lp-warning` | `#facc15`; 250, 204, 21 | `--ss-warning`, `--ion-color-warning`; warning border/indicator |
| Warning foreground | `$lp-warning-text` | `#993c1d`; 153, 60, 29 | `--ss-warning-text`; warning label/icon contrast |
| Legacy success | `$lp-success` | `#1d9e75`; 29, 158, 117 | `--ss-success`; successful actions/status (same as teal-400) |
| Legacy error | `$lp-error` | `#ef4444`; 239, 68, 68 | `--ss-error`; semantic error token, distinct from coral-600 |
| Legacy info | `$lp-info` | `#38bdf8`; 56, 189, 248 | Palette-defined semantic value; no `--ss-info` variable established |

### Runtime variables, shadow and spacing tokens

The variables are emitted under `:root` by `_theme.light.scss`; Sass aliases are in [`variables.scss`](src/theme/variables.scss#L1). The product is explicitly light-only in [`src/index.html`](src/index.html#L1) and the runtime dark-palette block is commented out. Thus “dark mode support” in comments is aspirational, not a confirmed working theme.

| Token(s) | Exact value | Purpose / evidence |
|---|---|---|
| `--ion-color-primary` / `--ss-primary` | `#534ab7` | Main brand/action purple |
| `--ion-color-primary-rgb`, `--ss-primary-rgb` | `83, 74, 183` | Alpha-color composition |
| `--ion-color-primary-shade` / `--ss-primary-hover` | `#3c3489` | Press/hover shade |
| `--ion-color-primary-tint` | `#afa9ec` | Lighter Ionic primary |
| `--ion-color-primary-contrast`, `--ss-primary-fg`, `--ss-text-on-primary` | `#fff` | Foreground on purple |
| `--ion-color-success` **(mismatch)** | `#534ab7`; RGB `83,74,183` | Ionic success is mapped to the primary purple, despite the app semantic positive/success tokens being teal |
| `--ion-color-danger`, `--ion-color-danger-rgb` | `#993c1d`; `153,60,29` | Ionic destructive treatment |
| `--ion-color-warning`, RGB | `#facc15`; `250,204,21` | Ionic warning |
| `--ion-color-tertiary` | `#afa9ec` | Ionic tertiary tint |
| `--ion-background-color` / `--ss-bg` | `#f7f6fb` | Light app canvas |
| `--ion-background-color-rgb` | `240,238,249` | **Does not match** `--ion-background-color`; source mismatch |
| `--ion-text-color` | `#1a1640` | Default Ionic text |
| `--ion-toolbar-background`, `--ion-card-background`, `--ion-tab-bar-background` | `#fff` | Default toolbar, card, tab surfaces |
| `--ion-toolbar-color`, `--ion-item-color` | `#1a1640` | Ionic heading/row text |
| `--ion-toolbar-border-color`, `--ion-tab-bar-border-color` | `transparent` | No default separator |
| `--ion-item-background` | `transparent` | Ionic rows expose underlying page |
| `--ion-item-border-color` | `#e8e4f8` | Row separators |
| `--ion-tab-bar-color`, `--ss-text` | `#6b6993` | Unselected tab and body text |
| `--ion-tab-bar-color-selected` | `#534ab7` | Selected tab |
| `--ss-surface-subtle`, `--ss-primary-subtle` | `#eeedfe` | Pale lavender panels |
| `--ss-surface-selected` | `#faf9ff` | Selected item fill |
| `--ss-primary-border` | `#cecbf6` | Primary outline |
| `--ss-text-disabled` | `#afa9ec` | Disabled text |
| `--ss-positive`, `--ss-positive-muted`, `--ss-positive-bg`, `--ss-positive-border` | `#0f6e56`, `#1d9e75`, `#e1f5ee`, `#1d9e75` | Balance roles |
| `--ss-negative`, `--ss-negative-muted`, `--ss-negative-bg`, `--ss-negative-border` | `#993c1d`, `#f0997b`, `#faece7`, `#f0997b` | Debt/error roles |
| `--ss-warning`, `--ss-warning-text`, `--ss-warning-bg` | `#facc15`, `#993c1d`, `#faeeda` | Warning roles |
| `--ss-success`, `--ss-success-text`, `--ss-success-bg` | `#1d9e75`, `#1d9e75`, **`#faeeda`** | Success bg incorrectly maps to amber, per emitted source |
| `--ss-error`, `--ss-error-text`, `--ss-error-bg` | `#ef4444`, `#ef4444`, **`#faeeda`** | Error bg also maps to amber; components often use `--ss-negative-bg` instead |
| `--ss-border`, `--ss-border-input`, `--ss-border-focus`, `--ss-border-valid`, `--ss-border-error`, `--ss-border-selected` | `#e8e4f8`, `#cecbf6`, `#534ab7`, `#0f6e56`, `#993c1d`, `#534ab7` | Structural and form-state borders |
| `--ss-tint-purple`, teal, amber, coral, pink | `#eeedfe`, `#e1f5ee`, `#faeeda`, `#faece7`, `#fbeaf0` | Category fills |
| `--ss-shadow-sm` | `0 1px 3px rgba(26,22,64,.06), 0 1px 2px rgba(26,22,64,.04)` | Low elevation |
| `--ss-shadow-md` | `0 4px 12px rgba(26,22,64,.08), 0 2px 4px rgba(26,22,64,.04)` | Buttons, floating tab bar |
| `--ss-shadow-lg` | `0 12px 32px rgba(26,22,64,.12), 0 4px 8px rgba(26,22,64,.06)` | Defined; use in component source not confirmed |
| `--ss-space-1/2/3/4/5/6/8/12` | `4/8/12/16/20/24/32/48px` | Declared 4px-base spacing scale; component source also uses many direct values |
| `--ss-radius-sm/md/lg/xl/2xl/3xl/full` | `4/8/12/16/24/30/9999px` | Declared radius scale |

**Sass compatibility aliases:** `$primary = #534ab7`, `$success = #1d9e75`, `$error = #993c1d`, `$warn = #facc15`, `$info = #38bdf8`, `$bg = #f7f6fb`, `$surface = #fff`, `$surface-borders = #eeedfe`, `$text = #6b6993`, `$text-light = #1a1640`, `$borders = #e8e4f8`. The `100wv` value assigned to `$border-radius-round` is invalid CSS unit spelling and appears unused. `$secondary` is `transparent`; `$accent` is white. Source comments in `variables.scss` disagree with the underlying palette for `$bg` and `$text-light`; the emitted palette values above are authoritative.

### Additional colors, auth, status and legacy

| Value | Where / role | Classification |
|---|---|---|
| `#7357e8` → RGB `115,87,232`; `#855ef0` → `133,94,240` | Auth SCSS `--auth-purple`; linear gradient on email submit; focus ring | Auth-specific accent; brighter than app primary |
| `#121038` | Auth `--auth-ink`; auth title | Auth ink |
| `#6f6a96` | Auth `--auth-muted`; subtitle | Auth secondary text |
| `#fcfbff`, `#faf9ff`, `#f8f5ff`, `#f8f6ff`, `#f7f3ff`, `#f9f6ff`, `#eee7ff`, `#fdfcff`, `#ede5fb66` | Auth page and email verification white/lilac layered backgrounds and radial gradients | Screen-local backgrounds; not centralized tokens |
| `#ddd9ef`, `#e3dff0`, `#9690bf`, `#8a84bb`, `#8882b8`, `#777198`, `#34304f`, `#17143f`, `#201943`, `#625d7c`, `#6a6385` | Auth field borders, placeholder/icons, dividers, copy and headings | Auth-local support colors; several near-duplicates of app text colors |
| `#7560df` | Auth input focus border; alpha focus halo uses `rgba(117,96,223,.1)` | Auth-local interaction |
| `#d14a43`, `#c03b34`, `#a33b59` | Auth invalid-field border, error text, resend error | Auth-local errors; three reds, not app coral |
| `#b9a4ff`, `#c7b7ff` | Verify-email stars/dots | Decorative accents |
| `#e9d9ff`, `#faf5ff`, `#eee2ff` | CSS cloud illustration gradients | Decorative fills |
| `#7e6cf2`, `#6354d8`, `#afa9ec` | Home balance-card and app-icon/splash generator gradient (45-degree) | Repeated hero/launcher gradient; not in semantic theme palette |
| `#34337d`, `#484391` | Welcome screen base and translucent email panel | Welcome-specific dark violet |
| `#ad96ff` | Welcome highlight and focus | Welcome-specific accent |
| `#1f1f1f`, `#f2f2f2`, `#747775`, `#5f6368`, `#303030`, `#001d35` | Google sign-in button, spinner and state layers | Third-party Google button palette; preserve its own branding |
| `#EA4335`, `#4285F4`, `#FBBC05`, `#34A853` | Inline Google “G” SVG | Google mark colors |
| `#E1F6EF`, `#386F61`, `#EEEDFF`, `#484091`, `#FAEDE7`, `#9F6B59`, `#FAEFDA`, `#86613B` | `AvatarComponent` hashed fallback-avatar swatches | Component palette; visually close to but not exact matches for the shared theme tint palette |
| `#191a1f`, `#1f1e26` | Avatar fallback / `avatar-dark` background | Dark-looking local fallback and legacy component |
| `#e0690e` | `theme-variables.helper.ts` and `.glowing-avatar` conic glow | Legacy orange. Helper is unreferenced by product components; avatar-dark component also has no template usage found |
| `#1eff7a`, `#ef4444`, `#ff4444`, `#9e9fa1` | `theme-variables.helper.ts`, `stonks-up.svg`, `stonks-down.svg`, `plain.svg` | Bright green/red/gray legacy helper and graphics; no product component use found by template search |
| `#26A69A`, `#33FFFFFF` | Default Android vector launcher background | Old Capacitor-generated teal icon backdrop; actual v26 adaptive icon references generated mipmap PNG instead |
| Ionic defaults `#0054e9`, `#0163aa`, `#6030ff`, `#2dd55b`, `#ffc409`, `#c5000f`, `#f4f5f8`, `#636469`, `#222428` | Dependency fallback values in Ionic CSS | Framework fallback palette, generally overridden for mapped primary/success/warning/danger/dark/medium; secondary/light are not mapped in the local theme |

**Literal and alpha colors outside the token sheet** include Google’s documented button colors, auth-only hex values, selected-card and focus overlays, gradients, and three hard-coded purple-tinted shadow families. The important implementation consequence is that a website should take the shared app purple and light product palette as its foundation, while the brighter auth and sunset colors are a separate campaign/entry-screen treatment.

### Semantic usage problems to reconcile

1. Ionic `success` is mapped to primary purple, whereas UI components commonly call teal success and the component theme helper declares electric green. `color="success"` Ionic controls can therefore disagree with `.text-positive`, `$success`, and balance chips.
2. `$success` aliases teal-400 (`#1d9e75`) while `$positive` uses darker teal-600 (`#0f6e56`). Success text uses one teal; balance-positive text another.
3. `$error` aliases coral-600 (`#993c1d`), `--ss-error` aliases vivid red (`#ef4444`), and theme `--ss-negative` again uses coral-600. Most UI uses `$error`/`--ss-negative`, but the helper and legacy SVG use brighter reds.
4. Warning/success/error background variables all point to amber `#faeeda`; only `--ss-negative-bg`/`--ss-positive-bg` correctly use coral/teal.
5. Auth forms use `#7357e8` and red shades distinct from the shared component form tokens.
6. `#f7f6fb` palette background and the separately set Ionic background RGB `240,238,249` disagree.

## 2. Typography

| Family / weight | Source | Where applied |
|---|---|---|
| Roboto 400 and 500 | `angular.json` loads `@fontsource/roboto/400.css` and `500.css`; files resolve to `node_modules/@fontsource/roboto/files/roboto-{latin,latin-ext,cyrillic,cyrillic-ext,greek,greek-ext,vietnamese,math,symbols}-{400,500}-normal.woff2` (and `.woff`) | Global app can render these faces. `google-sign-in-button.component.scss` explicitly uses `'Roboto', Arial, sans-serif`. |
| Ionic system stack, Material | Ionic `core.css`: `"Roboto", "Helvetica Neue", sans-serif` | Default Ionic document and components under MD mode. `provideIonicAngular()` leaves mode automatic; native iOS can choose iOS mode. |
| Ionic system stack, iOS | Ionic `core.css`: `-apple-system, BlinkMacSystemFont, "Helvetica Neue", "Roboto", sans-serif` | Platform-selected iOS default. |
| Explicit global app family | None found in app theme/global SCSS | Roboto is registered but app CSS does not explicitly set `font-family`; effective document family depends on Ionic mode/platform. |
| Auth/body heading family | Inherited | Auth styles use sizes/weights but do not set a family; they inherit Ionic document font. |

**Weight usage:** 400 regular, 500 medium, 600 semibold, 700 bold, 800 in home greeting/balance amount, and a compatibility `.font-w-900` class. Google’s button is 500. Roboto 600–900 files are not imported explicitly; the browser may synthesize weights. These must not be described as shipped Roboto faces without inspecting final build/font synthesis.

| Text role / selector | Size | Line height | Weight / tracking | Source and use |
|---|---:|---:|---|---|
| Screen heading `.screen-title` | 24px | 32px | 600, −0.01em | Shared app utility; no guarantee every screen uses it |
| Screen subtitle `.screen-subtitle` | 20px | 28px | 600 | Shared utility |
| Ionic header title | 16 / 20 / 28px (`small/medium/large`) | Ionic default | Unset | `_header.scss`; color overridden to primary purple |
| Home greeting `h1` | 28px | 1.08 | 800, −0.7px | Home-specific |
| Auth title | 30px (28px short screen; registration 28px) | 1.15 | 700, −0.6px | Login/register |
| Welcome hero heading | `clamp(36px,9vw,42px)`; short screen 34–38px / 32px | 1.08 | 700, −1px | Illustrated welcome |
| Email check/verify `h1` | 30px or `clamp(24px,6.8vw,30px)` | 36px or 1.2 | 700, −0.6px | Email status screens |
| Modal heading | 22px | Ionic default | 700, −0.3px | Sheet and full-screen dialog |
| Section title | 18px | 26px | 500, +0.01em | Shared `.section-title`, purple 2px accent underline |
| Card title | 16px | 1.2 | 700, +0.04em | `.card-title` is body-colored despite commented heading-color intent |
| Ionic card title/subtitle | 18px / 13px | Ionic default | 500 / 400 | Global `ion-card` override |
| Amount hero / large | 40px / 32px | 48px / 40px | 700, −0.02em / −0.01em | `.amount-hero`, `.amount-large`; tabular numbers |
| Balance-card amount | 32px | Unset | 700, −0.01em, tabular | Shared `.balance-card`; home’s separate hero amount is 38px/800 |
| Standard body / inputs | 16px | Utility 24px | Usually 400; input 16px minimum | `.text-base`, Ionic input (16px to prevent iOS zoom) |
| Card metadata | 14px | 20px | 400 | `.card-meta` |
| Field labels | 14px | 20px | 500 | `.field-label` |
| Caption/timestamp | 12px | 16px | 400 | Shared utilities; timestamp tabular |
| Buttons (Ionic) | 16px; `.btn-sm` 14px; `.btn-lg` 18px | Ionic/native default | 600; small 500; +0.01em | `_button.scss`; auth HTML submit 16px/600 |
| Bottom tabs | 12px | Ionic default | 500, +0.01em | `_tab-bar.scss` |
| Underline segment | 15px | Ionic default | 500; selected 600, +0.01em | `_tab-bar.scss` |
| Pill segment | 14px | Ionic default | 500 | `_tab-bar.scss` |
| Google sign-in | 14px | 1 | 500 contents, +0.25px | Google-style button |
| Signup/register body | 15px subtitle | 1.4 | 400 | Auth register override |
| Empty state title/body | 16px / 13px | Unset | Title 600; subtitle 400 default | Shared empty component |

The utility scale also declares 12/14/16/18/20/24/32/40px with line-heights 16/20/24/26/28/32/40/48px. Ionic’s uncustomized heading baseline is 500 weight, 1.2 line-height, `h1` 1.625rem, `h2` 1.5rem, `h3` 1.375rem, `h4` 1.25rem, `h5` 1.125rem and `h6` 1rem. App-specific classes and resets take precedence where applied.

**Inconsistency:** the utility scale coexists with direct one-off values (10–42px), varying line-height conventions (unitless, pixel and omitted), and auth-specific typography. `.card-title` tracking is unusually wide at 0.04em. In the main app, component headers often tint titles primary purple while semantic headings use near-black indigo. Body copy tends toward 13–16px; secondary metadata is sometimes 9–12.5px.

## 3. Components and layout

| Component/pattern | Confirmed styling | Source |
|---|---|---|
| Primary Ionic button | 48px height; full pill (9999px); 24px horizontal padding; 16px/600, +0.01em; solid `#534ab7`; purple shadow `0 2px 8px rgba(83,74,183,.25)`; active scale `.98` | `src/theme/components/_button.scss` |
| Outline button | White fill, 1.5px pale purple (`#cecbf6`) outline, purple text, no shadow | Same |
| Clear/subtle button | Clear fill (subtle fill declaration commented), purple text, no shadow; activated/hover purple at 18% alpha | Same |
| Danger button | Solid coral `#993c1d`, white text, shadow `0 2px 8px rgba(153,60,29,.2)` | Same |
| Small / large / CTA button | 36px/14px/500 with 16px sides; 56px/18px with 32px sides. Some local CTA overrides set 52–54px height or 16px radius. | Same; feature sheets |
| FAB | Purple fill, shared medium shadow | Same; group-list FAB |
| Standard `ion-input` | 16px text; 12px radius; 14px padding on each side and top/bottom. Outline 1.5px input border and white; solid field uses subtle pale fill. Focus/valid/error borders use purple/teal/coral. | `src/theme/components/_input.scss` |
| Auth text field | 48px high, 16px horizontal inset, 12px icon gap, `#ddd9ef` 1px border, 14px radius, 72%-white face; focus 3px soft purple halo. Two-field rhythm 10px. | `src/app/auth/styles/_auth-page.scss` |
| Standard Ionic card | Zero margin; 16px radius; white; shared small shadow; header 16px/16px/8px padding; content 8px/16px/16px. | `src/theme/components/_card.scss` |
| Surface card | 16px gap and padding, 16px radius; shadow `0 8px 24px rgba(83,74,183,.08), 0 2px 6px rgba(83,74,183,.04)` | `src/theme/components/_surface-card.scss` |
| Compact list card | 12px/16px padding; 12px radius; small shadow; 12px item gap | `_card.scss` |
| Balance hero card | 20px padding; 16px radius; medium shadow; nested dark translucent slab at 18% black, 12px radius, 10px/14px padding | `_card.scss` |
| Expense/detail rows | Common white row, 1px pale border, 14px radius, min-height 56–60px, 8–9px vertical/14px horizontal padding. Some expense list rows use 66px min height and no shadow. | Feature SCSS |
| Bottom tab navigation | White floating pill, 64px high, 24px radius, medium shadow; centered/max 480px; 16px outer margins and bottom plus safe area; content gets 96px lower padding. 24px icons, 12px/500 label, 5px active dot. | `src/theme/components/_tab-bar.scss`, `src/app/shared/wrappers/layout-wrapper/layout-wrapper.component.html` |
| Segments | Underline variant 44px minimum, 2px purple underline; pill variant 8px radius, 1px border, 3px inset, 36px button minimum. Expense allocation overrides track to purple at 10% with 14px outer and 11px selected radius. | `_tab-bar.scss`, `expense-allocation.component.scss` |
| Bottom sheet modal | 32px top corners; bottom corners set square; toolbar top padding 16px and left title gutter 24px. Title 22px/700, −0.3px. Feature sheet body commonly `0 24px 40px`. Common breakpoints initially 85% or 92% of viewport, with a few 65%. | `src/theme/components/_modal.scss`; component TS/SCSS |
| Fullscreen modal | Full width/height; square corners; page-color backdrop; toolbar 8px top/start/end padding. | `_modal.scss` |
| Toast | Top-positioned by service; 56px minimum, 16px radius, 1px border, shadow `0 6px 16px rgba(26,22,64,.08)`; 8px/14px inner padding; 14px message. Status icon is 26px with 5px padding. | `_toast.scss`, `src/app/core/services/toast.service.ts` |
| Chip/badge | Generic chip host uses `4px 12px` padding and 14px text. `rounded` uses `100vw`. Success/error/info/neutral fill at 10% corresponding semantic color. Individual list chip `.chip-sm`: 2px/8px, 11px/500. | `src/app/shared/components/chip/chip.component.scss`; feature overrides |
| Empty state | 12px/16px outer margin, 20px/16px padding, 16px radius, 1px translucent border, soft purple shadow, 44px icon tile / 14px tile radius. Title 16px/600; body 13px; action 13px/600 pill. | `src/app/shared/components/empty-state/empty-state.component.scss` |
| Avatar | Runtime sizes default 42px; round or 12px square; optional 3px white ring. Initials scale as max(38% of box, 12px); fallback swatches are hard-coded in the component. | `src/app/shared/components/avatar/avatar.component.ts/.scss` |
| Sticky expense action | Page bottom footer with 12px/16px padding and safe-area inset; background app canvas; default CTA remains full width. | `expense-item.component.scss`, `expense-allocation.component.scss` |
| Content rhythm / spacing | `--ss-space-*` is 4px-based, but main component spacing commonly uses 8, 10, 12, 14, 16, 20, 24, 28, 32, 40 and 48px directly. Many screens use 16–24px gutters. `bdd-flex` contributes an 8px unit spacing utility scale and responsive spacing helpers. | `_theme.light.scss`, `src/global.scss`, `node_modules/bdd-flex/src/bdd-variables.scss` |

App routes with recurring samples: home balance card and recent groups; groups list + FAB; group details, balances, expenses and member actions; expenses list, editor and allocation; activities/connections; settings; login/register/welcome/email verification. Screens primarily reuse Ionic elements and local `--ss-*`/Sass variables, but the level of reuse varies. Settings currently contains scaffold copy (“settings works!”), so it is not a mature visual example.

## 4. Brand and UI assets

Source-relative locations below are exact. Raster colors are visually apparent, but millions of blended pixels in gradients/transparent images are not a sensible set of brand color tokens; the shown palette is not inferred from raster pixels.

| Asset | Source size / characteristics | Confirmed use |
|---|---|---|
| `src/assets/images/logo.png` | 1126×890 PNG RGBA; friendly round planet with violet orbital ring, small green moon, face | Decorative brand image on welcome/login/register; positive home balance, splash/app icon generator input |
| `src/assets/images/logo_sad.png` | 1411×1115 PNG RGBA; same planet with downcast face/coral moon | Home net balance below zero |
| `src/assets/images/logo-offline.png` | 797×650 PNG RGBA; concerned planet with no-Wi-Fi badge | Offline home hero and offline empty state |
| `src/assets/images/email-verification-planet.png` | 1254×1254 PNG RGBA; smiling ringed planet holding email | Check-email and verify-email status screens |
| `src/assets/images/loog-expense.png` | 1254×1254 PNG RGBA; planet with receipt, star accents | Expense-list empty state (`loog` spelling is source filename) |
| `src/assets/images/login_background.png` | 941×1672 opaque PNG; illustrated friends watching a sunset over a coastal landscape | Welcome/onboarding full-screen background, composited with deep indigo fade |
| `src/assets/images/clauds.png` | 941×1672 PNG RGBA; transparent cloud bank | Bottom decoration on shared login/register page |
| `src/assets/images/claude-bg.png` | 2172×724 PNG RGBA; wide illustrated lavender clouds | Verify-email bottom scenery (filename differs from `clauds.png`) |
| `src/assets/images/gmail_icon_330px.svg.webp` | WebP 330×248; Gmail M | Present in assets; no code reference found |
| `src/assets/icons/svg/plain.svg` | SVG 400×300; transparent grid, gray dashed lines and masked radial gradient | Referenced by avatar-dark helper via dynamic name; component has no template use found |
| `src/assets/icons/svg/stonks-up.svg`, `stonks-down.svg` | SVG financial arrow line illustrations, vivid electric green/red glows | Present in asset folder; no component reference found |
| `src/assets/shapes.svg` | Ionic starter sample shapes; assorted unrelated bright colors | Present but not referenced in app source found |
| `src/assets/icon/favicon.png` | 256×256 RGBA; app-icon variant on violet square | `src/index.html` favicon |
| `assets/icon-only.png` | 1024×1024 PNG; full mascot on purple gradient | Generator input for legacy/iOS icon; Capacitor-generated native densities under `android/app/src/main/res/mipmap-*` |
| `assets/icon-foreground.png` + `assets/icon-background.png` | Both 1024×1024; transparent foreground simple planet and violet gradient background | Android adaptive icon layers; `ic_launcher.xml` references generated mipmap layers |
| `assets/splash.png`, `assets/splash-dark.png` | Both 2732×2732; visually identical in repository; purple field with smaller centered simple planet | Input source; Android native densities under `android/app/src/main/res/drawable*` |
| `assets/icon-background.png` | 1024×1024 gradient | App icon background and Android adaptive icon background |
| Inline Google SVG | Google “G” paths embedded in `google-sign-in-button.component.html` | Google auth control. Treat as third-party logo, not a product asset. |
| Ionicons | `ionicons@7.1.0` script from unpkg in `src/index.html`, `ionicons` package dependency; line/outline and filled pairs | App tabs, status, controls, illustrations’ small star/dot decoration often via icon glyphs. Not a custom ShareOrb icon set. |
| QR | `angularx-qrcode` generated inline | Group invite QR; dark `#1a1640`, light `#fff` read from CSS variables |

**Unverified:** the directory does not contain a vector wordmark, a documented logo clear-space rule, mascot usage guide, icon license/brand manual, or proof that every checked-in Capacitor density matches the current generator. The checked `assets/splash.png` and `assets/splash-dark.png` have the same SHA-256, despite their filenames.

## 5. Responsive behavior, animation and navigation

The app is built as a mobile-first native-feeling Ionic interface. `src/index.html` sets `viewport-fit=cover`, disables zoom, and declares a light color scheme; `app.component.ts` requests dark status-bar glyphs for the light canvas. App layout uses safe-area environment variables in tab navigation, auth screens, sticky CTAs and verification flows. Shared navigation is a floating bottom pill with five tabs (Home, Groups, Activities, Connections, Settings); tabs are hidden during focused flows by a UI signal. Header and list styles are generally fluid rather than defined by a desktop breakpoint.

| Responsive rule | Effect |
|---|---|
| `max-width: 360px` (auth, welcome) | Auth content narrows side padding to 20px; welcome email actions compress padding, gap and label size |
| `max-width: 360px` (group overview) | Three stats become two columns, with the paid card moved to the first row |
| `max-height: 700px` (auth, check-email, verify-email, welcome) | Shrinks logo/planet, heading gaps, cloud/decor height and auth form spacing |
| `max-height: 580px` (welcome) | Further compresses logo, copy, panel and action heights |
| `max-height: 500px` (welcome) | Allows scrolling instead of clipping content |
| `min-width: 700px` (verify-email) | Cloud background becomes width-scaled |
| `prefers-reduced-motion: reduce` | Verification spinner duration slows to 2400ms; it does not disable all decorative/component transitions |
| `env(safe-area-inset-*)` | Insets for notch/home-indicator around sheets, tabs, buttons, auth and verification pages |

Animations include: Ionic built-in transitions; `slideDown` (0.18s ease, translateY −6px to 0) for expanded balances; 0.25s chevron rotation; 0.15–0.2s row, segment and filter transitions; 0.2s tab-dot transition; auth focus/active 150ms and 100000s autofill background workaround; toast `animated: true`; welcome email action scale on press. No app-wide motion token or consistent reduced-motion policy exists.

## 6. Visual identity and reusable patterns

**Code-confirmed patterns:** saturated purple actions against very light gray-lilac pages; indigo ink; raised white cards; 12–16px corners on everyday surfaces and fuller 24–32px rounding for tabs/sheets; purple-tinted low shadows; small category/status fills; teal/coral amount semantics; mascot and space/sunset/cloud narrative in onboarding and empty/offline states. The interface favors dense, practical rows and forms with occasional large financial amounts.

**Inference:** the mascot is a recognizable brand character and strongest differentiator. The app is warm and approachable, though its core transaction surfaces stay restrained. The welcome flow has a more expressive photographic/illustrated mood than the authenticated product. The system appears to be in a migration from older palette/style choices: source comments say a previous orange gradient was replaced, while helper/SVG assets still encode orange, neon green and red.

**Inconsistencies:** `SimpleShare` vs `ShareOrb`; old-vs-new planet/icon variants; dual purple definitions (`#534ab7`, `#7357e8`, `#7e6cf2`/`#6354d8`); Sass color aliases vs runtime status tokens; success/error backgrounds both amber; Ionic success purple vs product teal; stale background RGB; different text inks, placeholder colors, errors and radii by flow; a mix of global component rules, tokens and direct feature-level values. CSS comments describe dark-mode support but no active dark palette is configured. Some legacy decorative assets appear unused. “Official brand colors” cannot be verified from the repository alone.

## 7. Recommendations for an Astro marketing site

1. **Resolve naming and logo ownership first.** Align the site’s displayed name with the intended ShareOrb identity. Auth pages currently literally display “SimpleShare”; package/native identity and domains say ShareOrb. Reuse the current friendly orbital planet only after confirming whether the high-detail transparent art or simpler launcher mark is the canonical lockup. Avoid drawing conclusions from the lack of a separate wordmark file.
2. **Carry across the product core.** Start from app primary `#534ab7`, heading `#1a1640`, body `#6b6993`, canvas `#f7f6fb`, white surfaces, border `#e8e4f8`, and positive/negative `#0f6e56` / `#993c1d`. The icon generator/home card violet gradient `#7e6cf2 → #6354d8 → #afa9ec` can be an optional expressive accent after design-owner confirmation; it is not the same as the shared primary token. Keep readable body sizes and restrained low-elevation cards.
3. **Use a web rhythm rather than recreating mobile chrome.** Translate the app’s 4px-base scale and rounded surface language into a clear desktop grid, generous section spacing and max-width content. Omit the bottom floating tab bar, native safe-area offsets, dense account lists and oversized mobile sheet corners. Use responsive navigation, conventional buttons, accessible focus states, and larger marketing-specific type/layout with the app’s dark indigo/purple tone.
4. **Use the mascot with restraint and context.** A single transparent planet illustration can anchor the hero or a product feature; expense, email, sad and offline variants suit supporting feature examples. The friends-at-sunset image is specific to the welcome/auth narrative and could support a community-oriented section, though its full portrait crop is mobile-first. Use the cloud artwork only when it fits a section boundary. Do not stretch or crop transparent character artwork as a logo.
5. **Turn actual product features into the story.** Website sections can show shared groups, expense entry, payer/split allocation, member balances/settlement, activity and invitations. Use screenshots or carefully recreated web product UI; maintain the purple/teal/coral financial semantics. Do not claim features beyond those visible in the app source.
6. **Create one documented website token layer.** Reuse selected app colors while resolving the success/error mapping defects before freezing web tokens. Keep Google sign-in’s palette confined to its auth button. Distinguish decorative sunset colors from actionable/status colors, and specify semantic roles, contrast, type scale, radius and shadow rather than copying every app local literal.
7. **Keep the public page mostly static and image-aware.** Astro’s image pipeline can optimize local raster art, and its islands model allows client-side JavaScript only for interactive pieces such as a signup/demo control. This suits a mostly content-led marketing page; see Astro’s [image guide](https://docs.astro.build/en/guides/images/) and [islands architecture](https://docs.astro.build/en/concepts/islands/). This is an implementation recommendation, separate from the app audit.

## 8. Missing or unverified information

- No approved ShareOrb brand manual, wordmark/vector logo, official color specification, type specification, or asset provenance notes were found in reviewed source paths.
- Repository text does not settle whether public brand should be “ShareOrb” or “SimpleShare.” Code provides evidence of both.
- No browser/native screenshots or rendered CSS inspection were used to determine exact platform-specific appearance, system font fallback at runtime, image compression quality in production, or WCAG contrast across translucent overlays.
- Authored component values and asset file dimensions are confirmed; raster-image pixel-derived colors are intentionally not presented as tokens.
- No broad named design-token map exists for every inline color/shadow/radius. Tables call out source families and common component values; additional raw values remain local to feature styles and third-party SVGs.
- The audit confirms only assets referenced by inspected templates/code and available local files; remote/user-provided avatars are runtime content and cannot be inventoried.
- Theme “dark mode” comments are not evidence of a functioning dark theme. Active app configuration declares light mode.

## Source index

Paths are relative to the repository root; line suffixes link to the defining source files.

| Area | Source |
|---|---|
| Raw palette and CSS variables | [`src/theme/_palette.scss`](src/theme/_palette.scss#L1), [`src/theme/_theme.light.scss`](src/theme/_theme.light.scss#L1), [`src/theme/variables.scss`](src/theme/variables.scss#L1) |
| Global styles and theme components | [`src/global.scss`](src/global.scss#L1), `src/theme/components/_{typography,button,card,surface-card,input,tab-bar,header,modal,toast}.scss` |
| Auth/welcome/verification | `src/app/auth/styles/_auth-page.scss`; `src/app/auth/pages/{welcome,login,register,check-email,verify-email}/` |
| Shared UI and tab navigation | `src/app/shared/components/{avatar,avatar-dark,empty-state,offline-empty-state,offline-warning,chip,list-item,google-sign-in-button}/`; `src/app/shared/wrappers/layout-wrapper/` |
| Product screens | `src/app/features/{home,groups,expenses,activities,connections,settings}/` |
| Runtime/Ionic setup and fonts | [`angular.json`](angular.json#L1), [`package.json`](package.json#L1), [`src/index.html`](src/index.html#L1), [`src/main.ts`](src/main.ts#L1), `src/app/app.component.ts` |
| Legacy helper and icons | [`src/app/shared/utils/theme-variables.helper.ts`](src/app/shared/utils/theme-variables.helper.ts#L1), `src/assets/icons/svg/`, [`src/assets/shapes.svg`](src/assets/shapes.svg#L1) |
| App icon source | [`scripts/build-app-icon.mjs`](scripts/build-app-icon.mjs#L1), `assets/icon-*.png`, `assets/splash*.png`, `android/app/src/main/res/` |

