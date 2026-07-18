# Model sources

These are the source `.glb` files for the 3D models on the landing page. They
live here, outside `public/`, so they don't ship with every deploy (nothing at
runtime loads them). Only the optimized outputs in `public/models/` are served.

## Regenerating the optimized models

The landing models must be Draco-free. The Draco WASM decoder needs
`'wasm-unsafe-eval'` in the CSP, so instead of shipping compressed meshes we
strip compression at asset-prep time and serve plain GLBs. See
`context/architecture-map.md` for the full CSP rationale.

The prep step uses the `@gltf-transform` CLI (a devDependency):

```bash
# from repo root, for each source model
pnpm exec gltf-transform optimize --compress false \
  models-src/<name>.glb public/models/<name>.glb
```

This is a manual step, run only when a model changes. Because it's CLI-only,
`depcheck` can't see the usage, so the three `@gltf-transform/*` packages are
listed in `.depcheckrc` to keep the dead-code check honest.
