# Ayush / On Air

A local, interactive creative-developer portfolio built with React, TypeScript, Next.js with Turbopack, custom WebGL2/GLSL, Node.js, and Express. A movable project board lives inside a retro CRT, with original illustrated identity artwork, vector project previews, project channels, a broadcast ticker, teletext help, and configurable contact details. All three initial projects are explicitly samples.

The design was studied at [ntch.design](https://ntch.design/). This is a personalized recreation of its interaction concept and composition, with original assets. It is not a verified pixel-perfect reproduction. Nothing has been published or deployed.

## Setup

Use Node.js 22.19 or newer and npm. Run commands from this folder:

```sh
npm install
npm run dev
```

- Portfolio: http://127.0.0.1:5178
- API: http://127.0.0.1:3001/api/health
- `npm run build` builds both applications.
- `npm run check` runs both TypeScript checks and the automated tests.
- `npm test` runs API, gesture-geometry, and camera-physics tests.
- `npm start` starts both production servers after a build.
- Next.js rewrites `/api` to Express in development and production. Set `BACKEND_ORIGIN` to change that upstream, or `NEXT_PUBLIC_API_URL` before building to use a separate public API origin.

Port 5178 avoids another local application already using 5173. Change the frontend package scripts if needed; update the backend CORS origins accordingly. Stop development with Ctrl+C. Install from the root; this is an npm workspace with a single root lockfile.

Environment files are optional for local development. Copy `backend/.env.example` to `backend/.env` and `frontend/.env.example` to `frontend/.env.local` to override defaults. Restart the corresponding development server after changing environment variables.

## Folder responsibilities

```text
frontend/
  public/assets/          Illustrated identity, SVG previews and self-hosted fonts
  src/app/                Application state, channel selection, keyboard shortcuts
  src/components/         Shared loading, empty and error presentation
  src/features/board/     Board rendering, pointer gestures, camera physics and tested geometry
  src/features/projects/  API-backed project detail view
  src/features/television/Identity, startup, WebGL renderer, shaders and CSS fallback
  src/features/help/      Teletext help and shortcut settings
  src/hooks/              Abortable resources and dialog focus management
  src/services/           Typed API client and external URL validation
  src/animations/         Interaction constants and visual motion variables
backend/
  src/routes/             HTTP contracts and project-ID validation
  src/repositories/       Content access behind an interchangeable interface
  src/data/               The editable portfolio.json content source
  src/config/             Backend environment configuration
  src/app.ts              Express composition, CORS and consistent errors
shared/types/             Profile, project, media and API error contracts
docs/                     Verification report and browser screenshots
```

Controllers and service layers are intentionally not added for simple read-only endpoints. Introduce them when behavior warrants them. Replace `PortfolioRepository.read()` with a database implementation later without changing frontend components.

## Identity and contact

Edit `backend/src/data/portfolio.json`. The `profile` object contains the supplied name, role, introduction and supporting text, plus:

```json
{
  "email": "",
  "availability": "",
  "socials": []
}
```

Set a real email, optional availability text, and links such as `{ "label": "GitHub", "url": "https://github.com/YOUR_ACCOUNT" }`. Blank destinations remain hidden; external links must use HTTP or HTTPS. The contact sticker opens a small contact screen that clearly explains when contact details have not been added. No fictional availability or personal claims are displayed.

Accessible identity text reads the profile name and introduction. The name and role lettering in the illustrated graphic are baked into the landscape and portrait JPEGs. For a rebrand, replace/regenerate those images as well as editing the profile, title/metadata, broadcast labels, and favicon. See [artwork assets and generation prompts](docs/ARTWORK.md). There are no frontend secrets. Everything prefixed `NEXT_PUBLIC_` is public browser configuration.

## Adding projects and media

All editable project records live in **one file**, `backend/src/data/portfolio.json`. Put optimized media in `frontend/public/assets/`, then add a record:

```json
{
  "id": "my-project",
  "channel": 4,
  "title": "My Project",
  "category": "Games",
  "description": "A factual description of the project.",
  "sample": false,
  "thumbnail": { "src": "/assets/my-project.webp", "alt": "Describe what the image shows" },
  "images": [{ "src": "/assets/my-project-detail.webp", "alt": "Describe the detail image" }],
  "technologies": ["TypeScript"],
  "position": { "x": -450, "y": 320, "rotation": -4 },
  "accent": "#c6ff8a"
}
```

IDs must be unique lowercase letters/numbers separated by single hyphens, at most 80 characters. Channel numbers should be positive and unique. Position coordinates and optional `boardPreview` width/height are relative to a 1920-pixel reference viewport and scale with viewport width. An optional `boardPreview` object accepts `src`, `alt`, `width`, `height`, and `shape` (`disc`, `phone`, or `image`) independently from the project detail thumbnail. Positions are stable across renders. Navigation sorts by channel number and wraps at either end. Keys 1–9 directly select matching channels; higher channels remain available through the board, Tab, arrows in a project, and previous/next controls.

Optional fields: `liveUrl`, `sourceUrl`, and `video` (an HTTP(S) URL or `/assets/` media path). Omit unavailable fields. Empty technologies and images are hidden cleanly. Detail images lazy-load; videos use native controls and do not autoplay. A sample record displays “Sample project — details coming soon.” Switch `sample` to `false` only when replacing it with real work. Use descriptive alt text and keep media dimensions and file sizes reasonable.

The backend rereads the data file per request. Reload the portfolio to fetch content edits. Asset edits do not require layout changes. For a live deployment, rebuild/redeploy when changing bundled assets or the bundled JSON source.

## API

| Endpoint | Response |
| --- | --- |
| `GET /api/health` | `{ "status": "ok" }` |
| `GET /api/profile` | `Profile` |
| `GET /api/projects` | `Project[]` |
| `GET /api/projects/:id` | `Project` |

Errors use `{ "error": { "code": "NOT_FOUND", "message": "..." } }`. Invalid project IDs return 400, missing projects/routes return 404, and repository failures return a generic 500 without exposing internal details. Development CORS permits only configured origins; it is not authentication. The frontend cancels stale requests and times out requests after 12 seconds, with a retry control on failures.

Backend settings: `PORT`, `HOST`, comma-separated `CORS_ORIGIN`, and optional `CONTENT_FILE` (an absolute path to another compatible JSON source). No database, authentication, admin UI, or form submission system is included.

## Controls and accessibility

Click or tap the central AYUSH graphic to expand it across the CRT. Pointer/finger movement adds a slight depth response. Click the expanded illustration or press Escape to shrink it back into the board. Enter opens the focused graphic; focus returns to it on close. A drag does not trigger opening or closing. Startup begins with the full illustration and zooms down into the board. Web Animations API transitions respect reduced motion. Durations live in `animations/settings.ts`. The yellow corner control opens dedicated help; a Home/reset button lives inside help.

- Mouse, pen or one-finger drag pulls the board with a short damped follow, release momentum, and resistance at the outer bounds; movement over seven pixels suppresses accidental project clicks. Pointer hit-testing and zoom anchoring account for the curved glass. Reduced motion removes coasting and lag.
- Wheel or two-finger pinch zooms around the pointer/midpoint, between 45% and 220%. `+` and `−` also zoom.
- Click/tap or Enter opens a focused project. Space opens from the board or returns from a view. Native button and link activation remains available.
- Arrows pan the board or navigate open projects. Page Up/Page Down change channels; R picks a random project; 1–9 select matching channels.
- Escape/Backspace return, Home resets, and `?` opens help.
- Tab walks controls; overlay focus is contained and returned to the origin when closed. Offscreen project buttons pan into view when reached by keyboard.
- A single-key shortcut switch is saved to localStorage, with a usable in-memory fallback if storage is blocked. Escape and native Tab/Enter/button interaction remain available with shortcuts off. Inputs and editable elements are excluded from shortcut handling.

The help screen documents the controls. Portrait and landscape layouts have separate sizing rules, safe-area spacing, and scrollable project/help content. The contact sticker remains at the CRT corner, with project navigation spaced clear of it. Decorative CRT layers ignore pointer events and assistive technology. `prefers-reduced-motion` removes startup/static/entrance/ticker motion and reduces scanline intensity. CSS animation pauses while the page is hidden.

## Motion and CRT tuning

`frontend/src/animations/settings.ts` holds startup/channel timer durations, zoom limits, wheel sensitivity, and drag threshold. `frontend/src/animations/motion.css` holds the matching CSS durations, entrance easing, ticker speed and scanline opacity. Keep JS and CSS startup/channel durations synchronized if changing them. The current reference composition and responsive overrides are in `frontend/src/styles/reference.css`; shared detail/help styling is in `frontend/src/index.css`. Fonts are self-hosted and include their OFL licenses.

The board and expanded illustration use a two-pass WebGL2 renderer: an image scene renders into a framebuffer, then a GLSL shader adds barrel curvature, radial RGB separation, warped phosphor dots, scanlines, restrained grain and soft glass edges. Resolution is capped to control GPU cost. The DOM retains semantic buttons, focus, and readable project/help views; CSS/canvas/SVG optics provide a fallback when WebGL is unavailable or its context is lost. Same-origin SVG previews are rasterized once before texture upload. External media must permit CORS texture access or the renderer falls back to DOM presentation.

`hooks/useCursorDrift.ts` adds a softly damped content translation toward the mouse inside a fixed CRT frame (maximum 15px horizontally and 10px vertically). It freezes during dragging, recenters on pointer exit, pauses when hidden, and is disabled for touch, reduced motion and detail/help overlays. Tune `cursorMotion` in `animations/settings.ts`: larger `distanceX`/`distanceY` increases travel; larger `follow` responds faster.

Holding the mouse or pen gives the board a temporary 5% zoom-out around the grabbed point, returning to the chosen camera zoom on release. This visual depth does not overwrite wheel/pinch zoom. Touch gestures retain their normal pinch behavior, and reduced motion disables the effect. In the same settings file, `motion.dragPressScale` controls depth (`0.95` means 5% smaller; `1` disables it), and `motion.dragPressFollow` controls response speed.

`features/board/physics.ts` controls follow rate, release decay, maximum speed and edge resistance. `animations/frameLoop.ts` shares a requestAnimationFrame loop, updates the camera before rendering and pauses when hidden. Board rendering pauses behind overlays. Reduced motion removes pull deformation, noise, coasting and large transitions; the broadcast stops scrolling. There is no rapid flashing. These are original implementations informed by the live reference; its exact shader and animation physics have not been duplicated.

## Production build and deployment

No deployment has been performed. When you choose to deploy:

1. Set `BACKEND_ORIGIN` before building so the Next.js API rewrite reaches Express. The default is `http://127.0.0.1:3001`. For separate public API hosting, set `NEXT_PUBLIC_API_URL=https://YOUR_API_ORIGIN` before building; it is public browser configuration.
2. Set backend `CORS_ORIGIN` to the exact frontend origin(s), `PORT` to the platform port, and `HOST=0.0.0.0` when required by your host.
3. Run `npm ci`, `npm run check`, and `npm run build`.
4. Run `npm start` for both servers on the local defaults. For separate services use `npm run start -w backend` and `npm run start -w frontend`. Adapt the frontend hostname/port flags to your hosting environment.
5. Retain `frontend/.next`, `frontend/public`, `backend/dist` including the copied data file, workspace manifests, and installed production dependencies. Both applications are Node servers; the frontend is no longer a Vite static build.
6. Use HTTPS, process supervision, and a reverse proxy appropriate to your host. Nothing in this repository publishes automatically.

See [the verification report](docs/VERIFICATION.md) for completed checks, screenshots, and limits that need physical-device review.

The scrolling broadcast tile sits below the initial board view; drag upward to reveal it. The default view intentionally keeps only the identity illustration, peripheral previews, and corner stickers visible.
