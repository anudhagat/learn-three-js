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
  `clickWorld` and `getView`. It combines everything below and returns events
  (`impact`, `launch`) so other things can react without inspecting state.
- `ball.ts` is the dynamics: exact motion under gravity, the exact moment of impact
  inside a frame, bounce, rest, and `getMode` (resting, rising or falling, worked out
  from the state rather than stored).
- `deformation.ts` turns ball state into squash, stretch and tilt. It only reads the
  ball and never changes it. `intensity.ts` holds the speed curve it shares with the
  dust.
- `expression.ts` picks the face (happy, sleepy or dizzy) and how drowsy the ball is.
- `dust.ts` and `shadow.ts` are the sparkles and the contact shadow.
- `propMotion.ts` is the click reactions for the candy. Each is a function of the
  seconds since the click, and is exactly at rest again once it finishes.
- `config.ts` has the tuning numbers: gravity, bounciness, sleep delay, and so on.

### `render/`: the picture

- `BouncingScene.tsx` steps the world every frame and applies the result to the ball,
  its shadow and the sparkles.
- `CandyScene.tsx` builds the ground, sky, fog and props. `CandyProps.tsx` has the six
  kinds of candy and their click reactions, using `useReaction.ts`.
- `Sky.tsx` is the dusk: a banded dome, sun, stars, drifting clouds and hills.
  `SkyReflections.tsx` captures that sky once so the glossy candy can reflect it.
- `GrassLawn.tsx` draws the 3D grass blades as one instanced mesh. `grassBlades.ts`
  decides where they grow: only in the part of the ground the camera can see, fading
  out with distance, with the wind switched off for far blades.
- `groundCurve.ts` curves the ground into a rounded horizon, and props follow it.
- `faceTexture.ts` and `faceLook.ts` draw the faces, including the frames of the
  face nodding off. `candyTextures.ts` draws the sky bands, grass and its normal map.
- `candyLayout.ts` and `camera.ts` hold where the props are and where the camera is.
  Tests check that props stay in view and out of the ball's way.

## Tests

Tests sit next to the code they cover (`ball.test.ts` beside `ball.ts`), and run in
plain Node. They cover the dynamics, the sparkles, the face logic, the prop motion,
the grass layout, the ground curve, noise and normal-map maths, and the layouts.

Changes so far were made test-first: write the failing test, watch it fail, then make
it pass. Things that only exist on screen (shaders, canvas drawing, lighting) can't be
unit tested here, and were checked by eye.

## Changing the look

- **Bounce and feel:** `src/sim/config.ts`.
- **Candy:** add an entry to `CANDY_PROPS` in `render/candyLayout.ts`. A new kind needs
  a component in `CandyProps.tsx`.
- **Sky colours:** `SKY_BANDS` in `render/candyTextures.ts`; sun position in
  `render/skyLayout.ts` (the key light follows it, so the shadows stay right).
- **How round the horizon is:** `GROUND_RADIUS` in `render/groundCurve.ts`.
- **How much grass:** `TUFT_COUNT` in `render/GrassLawn.tsx`, and the reach in
  `render/grassBlades.ts`.

## Things to know

- The grass is the heaviest part of the scene. I haven't measured its frame rate; if
  it stutters on a weak GPU, lower `TUFT_COUNT`.
- The grass is only grown where the default camera looks. If you move the camera,
  update `render/camera.ts` and check `isInView` in `render/grassBlades.ts`.
- Not done: a frame-rate readout, adaptive quality, sound, and bloom on the sparkles.
