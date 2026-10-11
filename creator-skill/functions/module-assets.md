# Module Assets

Active module assets live in the repository-level `assets/<moduleIdentity UUID>/` directory. Keep module-specific images, videos, models, and SceneDeck thumbnails under that module's signed UUID folder. Do not store module assets under `modules/<module>/assets/`.

## Referencing Assets

Use `moduleAssetUrl` from `modules/shared/react` for runtime references:

```tsx
import { moduleAssetUrl } from '../../../shared/react';

const imageUrl = moduleAssetUrl('signed-module-uuid', 'images/example.png');
```

The first argument is the module's `moduleIdentity.id`; the second is a path relative to its UUID folder. Use it for images, video, models, and assets loaded by canvas or WebGL code. For a CSS background, pass the URL through a CSS custom property from the component rather than hard-coding an asset path in CSS.

SceneDeck thumbnails use `scenedeck-thumbnails/<scene-id>.png` under the same UUID folder. Pass the signed UUID in the SceneDeck `assetId` prop; the application-level catalog resolves it from `outlines.json`.

## Local and CDN URLs

During local development, Vite serves the repository-level `assets/` directory as static files. `moduleAssetUrl` defaults to the app base URL, so the UUID folder is served directly below that base.

For CDN hosting, set `VITE_ASSET_BASE_URL` to the CDN prefix that maps the repository-level `assets/` directory. For example, if `assets/<uuid>/photo.png` is uploaded as `https://cdn.example.com/assets/<uuid>/photo.png`, set:

```text
VITE_ASSET_BASE_URL=https://cdn.example.com/assets
```

The setting is read once by the app build and applies to every module. When it is set during a production build, Vite skips copying the local asset directory into `dist`; upload the repository-level `assets/` directory to the configured CDN prefix as a separate deployment step. Leave the variable unset for local development or builds that need local static assets.
