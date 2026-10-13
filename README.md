# PythiaTestApp

React Native CLI test assignment: chat screen with Pythia (mock server, no Expo).

## Demo

[`media/demo.mp4`](media/demo.mp4): iPhone 17 Pro simulator against the mock in its default (error-injecting) mode, showing sending a message, Pythia thinking, and a Not sent message recovered with Retry.

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

Caching, typed endpoints, and generated hooks for `GET/POST /messages` without a hand-rolled client. The history cache is the single source of truth for server messages: send and poll results are merged into it with `updateQueryData`. Send/poll steps that must respect `Retry-After` live in `src/api/messages/sendFlow.ts`, not in UI components. RTK's built-in `pollingInterval` is not used because a fixed interval cannot follow a per-response `Retry-After`.

### Mock base URL

| Platform | URL |
| --- | --- |
| iOS Simulator | `http://localhost:4000` |
| Android Emulator | `http://10.0.2.2:4000` |

Set in `src/api/baseUrl.ts` via `Platform.OS`. Emulator / cleartext details: local `docs/rn-test-mock/README.md`.

### Send / poll / `client_message_id`

1. `POST /messages` with a client-generated `client_message_id` (`react-native-uuid`, one per message) and `text`.
2. **One POST attempt** (`sendMessageOnce`). On `500`, network error, or the 15 s request timeout, the bubble stays with **Not sent** + **Retry**. There is no automatic send retry: Retry re-sends the **same** `client_message_id` and text. The mock is idempotent, so this is safe even when the server saved the message before answering 500.
3. On `202` / `200` the user message and the reply go into the history cache. A `generating` reply renders as **Pythia is thinking...** and disables send.
4. `pollUntilDone` waits the previous `Retry-After` (2 s if the server sent none), then calls `GET /messages/{reply.id}`, and repeats until `status === "done"`. Any poll error (`429`, `500`, network) only means "wait and poll again": it never turns the message into Not sent. Polling stops only when the reply is done or the screen unmounts (`AbortSignal`).
5. Double tap on Send: a synchronous ref guard drops the second tap before React re-renders, so it cannot create a second `client_message_id`.
6. Replies that are still `generating` when history loads (e.g. after an app reload) are polled too; at most one poll runs per reply id.

`POST /reset` is not exposed in the app.

### Message list state model

Two sources, each with one explicit state:

- **Server messages** (history cache): `status` is `generating` or `done`, exactly as the API returns it.
- **Outbound messages** (local, not yet accepted by the server): `delivery` is `sending` or `failed` (`OutboundMessage` in `chatListTypes.ts`). After a successful POST the local copy is dropped, because the server copy is now in the cache.

`buildChatList` turns both into rows with one `kind` each:

| `kind` | Meaning |
| --- | --- |
| `intro` | First assistant message with `signs` (natal chart + copy) |
| `user` | User bubble; `delivery`: `sending` \| `failed` \| `sent` |
| `thinking` | A server reply with `status: "generating"` |
| `assistant` | Done reply text + mascot |

A server user message is hidden while a local copy with the same `client_message_id` exists, so a 500-after-save never shows Not sent next to a duplicate bubble.

`isBusy` is derived (a reply is generating, or a POST is in flight), not stored. While busy, Send and Retry are disabled. Send also stays off until history has loaded. New messages are allowed when only failed bubbles remain.

### Re-renders

Rows are rebuilt on every list change, so `ChatMessageItem` delegates to memoized leaves that take primitives (`text`, `clientMessageId`, …). `retry` has a stable identity because the failed row passes its own text back, so a send/poll step only re-renders the rows whose content changed.

### Known trade-offs

- Not sent bubbles live in component state. After an app restart they are gone (if the server had saved the message, it appears in history as sent).
- Only one turn at a time: Send is disabled while any reply is generating, as the brief requires.
- When the server gives no `Retry-After` (network error, reply found in history), polling waits a fixed 2 s.
- Keyboard handling uses RN `Keyboard` events, not `react-native-keyboard-controller`. On Android the lift starts after `keyboardDidShow`, so it trails the IME animation slightly.

### Still unfinished

- Linked font binaries under `android/` / `ios/nanoicons-fonts/` are build products, not sources — see Design assets above.
- Liquid glass needs Xcode 26+ / iOS 26 simulator (current boot: iOS 18.6 → blur fallback). Older iOS and Android use BlurView, not the real liquid material.
- No automated tests (optional in the brief). The template `__tests__/App.test.tsx` does not run as is: Jest is not configured to transform the ESM build of `react-redux`.

## Time spent

About **4 hours** on 2026-10-13 (≈14:00–17:55, UTC+3), measured from git commit timestamps.

| Time | Step |
| --- | --- |
| 14:00–15:11 | Project init (RN CLI), Figma assets: colors, fonts, icons (~1.2 h) |
| 15:11–15:44 | RTK Query API layer, `Retry-After` handling (~0.5 h) |
| 15:44–16:54 | Chat screen layout, inverted list, keyboard lift (~1 h) |
| 16:54–17:30 | Send, thinking, Not sent + Retry without duplicates (~0.5 h) |
| 17:30–17:55 | Review against the brief: state model simplification, poll cancellation, memoized rows, README (~0.5 h) |

## AI assistance

Cursor agent helped export Figma assets, wire fonts/icons, add the RTK Query API layer, build the chat screen layout, wire send / poll / Not sent + Retry, review the code against the brief (simplified message state, poll cancellation, memoized rows), and draft this README structure. Product decisions (CLI vs Expo, IBM Plex Mono, chat-only icon set, nano-icons over SVG components, gitignore for linked font copies, RTK Query for the mock, liquid-glass + Android fallback, manual send Retry only) are intentional for the assignment.
