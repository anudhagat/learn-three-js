# Bouncy Emoji Ball

A small React Three Fiber toy: an emoji ball drops onto a meadow at dusk, bounces
with squash and stretch, throws out sparkles when it lands, and falls asleep when it
comes to rest. Click the ball, or the candy around it, to play.

Built with React, [React Three Fiber](https://r3f.docs.pmnd.rs/), three.js, Vite and
Vitest. There are no image or model files: every texture is drawn in code.

## Running it

```sh
npm install
npm run dev        # start the dev server
npm test           # run the unit tests once
npm run test:watch # re-run tests as you edit
npm run lint
npm run build      # type-check and make a production build
```

## What you can do

| Click | What happens |
| --- | --- |
| The ball | It jumps back up to its starting height. Ignored while the ball is already rising, so you can't keep boosting it. |
| The ball, five times within three seconds | It gets dizzy for a couple of seconds. |
| A lollipop | The swirl spins a few turns and slows to a stop. |
| A candy cane | It does a wiggle dance. |
| A gumdrop | It giggles like jelly. |
| A donut | It stands on its edge, twirls like a spinning coin, tips over and rocks to a stop. |
| A cupcake | The cherry bounces like a ball coming to rest. |
| A macaron | The shells wobble apart and settle back. |

The ball also reacts on its own: it tilts up toward the top of each bounce, squashes
and stretches with its speed, nods off a second after it settles, and leaves a
shadow that shrinks and fades as it rises.

## How the code is organised

The code is split in two so the behaviour can be tested without a browser or a GPU.

```
src/
  sim/       Pure TypeScript. No React, no three.js, no randomness of its own.
  render/    React Three Fiber components and canvas drawing. Thin: it turns
             what sim/ says into meshes and textures.
  App.tsx    The canvas, lights and scene.
```

### `sim/`: the rules

State is plain immutable objects, changed by pure functions. Anything random takes
an injected `Rng` (see `rng.ts`), so tests can use a seeded one.

- `world.ts` is the one entry point the renderer uses: `createWorld`, `stepWorld`,
  `clickWorld` and `getView`. It returns events (`impact`, `launch`) so other things
  can react without inspecting state.
- `ball.ts` is the dynamics: exact motion under gravity, the exact moment of impact
  inside a frame, bounce, rest, and `getMode` (worked out from the state, not stored).
- `deformation.ts` turns ball state into squash, stretch and tilt, and shares the speed
  curve in `intensity.ts` with the dust.
- `expression.ts` picks the face (happy, sleepy or dizzy) and how drowsy the ball is.
- `dust.ts` and `shadow.ts` are the sparkles and the contact shadow.
- `propMotion.ts` is the candy's click reactions. Each is a function of the seconds
  since the click, and is exactly at rest again once it finishes.
- `config.ts` has the tuning numbers: gravity, bounciness, sleep delay, and so on.

### `render/`: the picture

- `BouncingScene.tsx` steps the world every frame and applies the result to the ball,
  its shadow and the sparkles.
- `CandyScene.tsx` builds the ground, sky, fog and props. `CandyProps.tsx` has the six
  kinds of candy and their click reactions, using `useReaction.ts`.
- `Sky.tsx` is the dusk: a banded dome, sun, stars, drifting clouds and hills.
  `SkyReflections.tsx` captures it once so the glossy candy can reflect it.
- `GrassLawn.tsx` draws the grass blades as one instanced mesh. `grassBlades.ts` decides
  where they grow: only where the camera can see, fading out with distance, with the
  wind off for far blades.
- `groundCurve.ts` curves the ground into a rounded horizon, and props follow it.
- `faceTexture.ts` and `faceLook.ts` draw the faces. `candyTextures.ts` draws the sky
  bands, grass and its normal map.
- `candyLayout.ts` and `camera.ts` hold where the props and camera are. Tests check
  that props stay in view and out of the ball's way.

## Tests

Tests sit next to the code they cover (`ball.test.ts` beside `ball.ts`) and run in
plain Node. Changes were made test-first. Things that only exist on screen (shaders,
canvas drawing, lighting) can't be unit tested here, and were checked by eye.

## Changing the look

- **Bounce and feel:** `src/sim/config.ts`.
- **Candy:** add an entry to `CANDY_PROPS` in `render/candyLayout.ts`. A new kind needs
  a component in `CandyProps.tsx`.
- **Sky colours:** `SKY_BANDS` in `render/candyTextures.ts`; sun position in
  `render/skyLayout.ts` (the key light follows it, so the shadows stay right).
- **How round the horizon is:** `GROUND_RADIUS` in `render/groundCurve.ts`.
- **How much grass:** `TUFT_COUNT` in `render/GrassLawn.tsx`, and the reach in
  `render/grassBlades.ts`.
- **The camera:** `render/camera.ts`. The grass only grows where the default camera
  looks, so if you move the camera, check `isInView` in `render/grassBlades.ts` too.
- **Not done yet:** sound, and bloom on the sparkles.

## Performance

The scene costs mostly pixels, and a Retina screen has four times as many as a normal
one. So the canvas is capped at a pixel ratio of 1.5 (`MAX_PIXEL_RATIO` in `App.tsx`),
which looks almost as sharp as full resolution. Raise it for a crisper picture, or
lower it (1.25 is a little softer on thin lines) for a smoother one.

Measured in Chrome on an Intel Iris Pro, an old integrated GPU and so a worst case,
with the frame-rate cap off and GPU time from WebGL timer queries:

| Simulated Retina screen | GPU time per frame | Frame rate |
| --- | --- | --- |
| Before: ratio up to 2 | 25 to 34 ms | 31 to 45 fps |
| After: ratio up to 1.5 | 16 to 20 ms | 55 to 65 fps |

Normal screens are unchanged. Times crept up during each run as the GPU warmed, so
treat these as ranges. A steady 60 fps needs under 16.7 ms, so this GPU is close but
not quite there.

Other findings, from 122 draw calls and about 320k triangles per frame:

- **The grass is not the problem.** It is one draw of about 70k triangles and costs
  about 2 ms. Halving `TUFT_COUNT` would save about 1 ms, not worth a thinner lawn.
- **The shadows are cheap**, under 0.5 ms.
- **Clicks are cheap**, under 1 ms each on average. There were one-off frame spikes
  after clicking the macaron (about 26 ms, seen twice) and the donut (63 ms, once). The
  cause is not known.
- **The frame loop allocates about 5 MB a second**, cleared by the browser every second
  or so. Where it comes from has not been profiled.

Ideas not yet done:

1. Adaptive quality: drei's `PerformanceMonitor` can lower `dpr` only when the frame
   rate drops, so strong GPUs keep full resolution. A frame-rate readout (drei's
   `Stats`) would help while tuning it.
2. Find the rest of the pixel cost. With no grass and no shadows a frame is still 6.9 ms
   at ratio 1. The glossy `meshPhysicalMaterial` (clear coat) on the candy is the first
   suspect; try `meshStandardMaterial` on one kind and compare.
3. Profile the frame loop for the allocations (a new world object and dust arrays every
   frame are likely) and the macaron and donut spikes.

To measure again, build the app, serve it with `npm run preview` and drive it with
Chrome through puppeteer-core, with the frame-rate cap off (`--disable-frame-rate-limit
--disable-gpu-vsync`). Time the GPU with the `EXT_disjoint_timer_query_webgl2`
extension, and skip the grass or shadow draws to see what each costs. Don't take
screenshots while the cap is off; they hang. The scripts are not checked in.
