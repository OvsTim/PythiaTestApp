# PythiaTestApp

React Native CLI test assignment: chat screen with Pythia (mock server, no Expo).

## Why React Native CLI (not Expo)

The brief suggests Expo, but this repo uses the official React Native CLI template. Native iOS/Android projects stay the source of truth; fonts and icons are wired through CLI tooling (`react-native.config.js`, `react-native-nano-icons`, CocoaPods) instead of Expo modules.

## Design assets

All design tokens and media for the chat screen live under `src/assets/`:

| Path | Role | In git? |
| --- | --- | --- |
| `src/assets/colors.ts` | Color tokens from the Figma Colors frame | yes |
| `src/assets/fonts.ts` | `fontFamily` names for StyleSheet | yes |
| `src/assets/fonts/` | Text `.ttf` sources (Playfair, IBM Plex Mono) | yes |
| `src/assets/svg/` | Source SVGs for chat icons | yes |
| `src/assets/nanoicons/` | Generated icon font + glyphmap (from SVG; imported by JS) | yes |
| `src/assets/icons.ts` | Typed `Icon` component from nano-icons | yes |
| `src/assets/images/` | Raster overlays used on the chat screen | yes |
| `android/.../assets/fonts/` | Native copies after linking | **no** — gitignored |
| `ios/nanoicons-fonts/` | Nano-icons iOS staging copy | **no** — gitignored |
| `*/link-assets-manifest.json` | `react-native-asset` manifests | **no** — gitignored |

### What we commit vs regenerate

**Commit** the sources and the nano-icons build under `src/` (SVG, text TTFs, `nanoicons/chat.ttf` + `chat.glyphmap.json`). The glyphmap is imported in TypeScript, so that folder stays in the repo.

**Do not commit** native-linked duplicates:

- Android `app/src/main/assets/fonts/*` — copies from `react-native-asset` (text fonts) and `react-native-nano-icons` (`chat-<hash>.ttf`)
- iOS `nanoicons-fonts/` — staging folder filled by the nano-icons CLI

After clone or when SVGs / text fonts change:

```sh
npm run assets   # = fonts link + icons build/link
```

### Colors

Tokens mirror Figma names (`text`, `text70`, `textUnactive`, `danger`, `accent`, `background`, `lightAccent`, `lightArea`, `lightBorder`). `backgroundLinear` drives the chat screen `LinearGradient`. `notSent` (`#E6A8A8`) comes from the “Not sent / Retry” state and is separate from `danger`.

### Fonts

- **Playfair Display Regular** — headings / title (“Chat”), as in the mock.
- **IBM Plex Mono Regular + SemiBold** — body, input, buttons. The brief forbids embedding SF Mono; we match sizes/letter-spacing from the mock, not glyph shape.

Text fonts live in `src/assets/fonts/` and are linked with `react-native.config.js` → `npm run fonts` (`react-native-asset`).

### Icons

Only icons used on the chat screens (source SVGs in `src/assets/svg/`):

- `arrow-up` — send
- `menu` — decorative control in the message input (no action)
- `chevron-left` — back in the nav (no action)
- `restart` — retry after a failed send

Stack: [`react-native-nano-icons`](https://reactnative.directory/package/react-native-nano-icons). Custom Figma SVGs are compiled into a native icon font (faster than `react-native-svg` components for repeated symbols; unlike `react-native-vector-icons`, the font is built from our files automatically).

Config: [`.nanoicons.json`](.nanoicons.json). Generate under `src/assets/nanoicons/` and link into native projects:

```sh
npm run icons
```

Usage:

```ts
import {Icon} from './src/assets/icons';

<Icon name="arrow-up" size={24} color="#FFFFFF" />
```

Metro (`withNanoIcons`) hot-reloads SVG edits in development. Before a release build, run `npm run assets` so native links match the current glyphmap.

### Images

- `bg.png` — chat background texture (apply ~20% opacity in UI, as in Figma)
- `palantir.png` — crystal ball under the input (`Unactive` = same asset + `opacity: 0.5`)
- `mascot.png` — Pythia avatar next to assistant messages

Unused Figma icons and the birth-date / auth overlays are intentionally omitted.

## Run

```sh
npm install
npm run assets
# iOS native deps (after adding native packages)
cd ios && bundle exec pod install && cd ..

npm start
npm run ios   # or: npm run android
```

Mock server (not in this repo): see local `docs/rn-test-mock` — `npm start` / `npm run start:calm`, docs at `http://localhost:4000/docs`.

## Architecture notes

### Layers

- **UI** — `src/screens/chat/`: `ChatScreen` (layout) + `useChatController` (list merge, send / retry). Presentational pieces live in `components/`.
- **Assets** — `src/assets/` (colors, fonts, icons, images).
- **API** — `src/api/`: shared client (`baseUrl`, `baseQuery`, store) + feature modules. Messages live under `src/api/messages/` (RTK Query slice + `sendMessageOnce` / `pollUntilDone`). The screen never imports RTK Query endpoints for send/poll.

### Chat screen layout

- Edge-to-edge: Android `edgeToEdgeEnabled=true`, translucent status bar; header/input pad with `useSafeAreaInsets` so the gradient still draws under system bars.
- Message list: inverted `FlatList` (newest at the bottom, scroll up for history); content scrolls under the absolute header.
- Keyboard: `useKeyboardLift` drives composer padding and palantir translate from one IME clock (iOS + Android). No `KeyboardAvoidingView`.
- Glass: [`@callstack/liquid-glass`](https://reactnative.directory/package/@callstack/liquid-glass) (`clear` + `dark`) on **iOS 26+** with tokens `glassTintDark` / `glassTintLight`. Older iOS and Android use BlurView via `GlassSurface`.
- Background: `react-native-linear-gradient` + `bg.png` at 20% opacity + dimmed `palantir.png` behind the input.
- Intro comes from `GET /messages` (assistant portrait with `signs`). Composer send / poll / Not sent + Retry are wired through `useChatController`.

### Why RTK Query

Caching, typed endpoints, and generated hooks for `GET/POST /messages` without a hand-rolled client. Send/poll orchestration that must respect `Retry-After` and idempotent `client_message_id` lives in `src/api/messages/sendAndPoll`, not in UI components.

### Mock base URL

| Platform | URL |
| --- | --- |
| iOS Simulator | `http://localhost:4000` |
| Android Emulator | `http://10.0.2.2:4000` |

Set in `src/api/baseUrl.ts` via `Platform.OS`. Emulator / cleartext details: local `docs/rn-test-mock/README.md`.

### Send / poll / `client_message_id`

1. `POST /messages` with a client-generated `client_message_id` (`react-native-uuid`) and `text`.
2. **One POST attempt.** On `500` / network (or other POST failure), the bubble stays with **Not sent** + **Retry**. There is no automatic send retry — the user taps Retry with the **same** `client_message_id` (mock is idempotent; safe even if the server saved before returning 500).
3. After POST is accepted (`202` / `200`), show **Pythia is thinking...** and disable send. Poll `GET /messages/{reply.id}` after waiting `Retry-After`; on `429` / poll `500` / network, wait and poll again inside `pollUntilDone` (poll errors are **not** Not sent). If that cycle still fails, the controller runs **one** more `pollUntilDone` — no infinite outer loop.
4. Stop when `reply.status === "done"`. If the reply is already `done` on an idempotent send retry, skip thinking. If both poll cycles fail, the turn stays on thinking (still not Not sent).

Helpers: `sendMessageOnce` + `pollUntilDone` (controller phases); `sendAndPoll` composes both. `POST /reset` is not exposed.

### Message list state model

Each FlatList row has one `kind` (no overlapping flags):

| `kind` | Meaning |
| --- | --- |
| `intro` | First assistant message with `signs` (natal chart + copy) |
| `user` | User bubble; `delivery`: `sending` \| `failed` \| `sent` |
| `thinking` | Mascot + “Pythia is thinking...” (only after POST accepted) |
| `assistant` | Done reply text + mascot |

Outbound turns use one phase each (`sending` → `failed` **or** `sending` → `thinking` → removed): see `OutboundTurn` in `chatListTypes.ts`. Local rows merge with `GET /messages` by `client_message_id` so a 500-after-save never shows both Not sent and a duplicate server bubble. Server `generating` replies become `thinking`, not empty text.

While send or poll is in flight (`isBusy`), send and Retry are disabled. Send stays off until the first history response settles. New messages are allowed when only failed bubbles remain.

### Still unfinished

- Linked font binaries under `android/` / `ios/nanoicons-fonts/` are build products, not sources — see Design assets above.
- Liquid glass needs Xcode 26+ / iOS 26 simulator (current boot: iOS 18.6 → blur fallback). Older iOS and Android use BlurView, not the real liquid material.

## AI assistance

Cursor agent helped export Figma assets, wire fonts/icons, add the RTK Query API layer, build the chat screen layout, wire send / poll / Not sent + Retry, and draft this README structure. Product decisions (CLI vs Expo, IBM Plex Mono, chat-only icon set, nano-icons over SVG components, gitignore for linked font copies, RTK Query for the mock, liquid-glass + Android fallback, manual send Retry only) are intentional for the assignment.
