# Tree Shaking & Bundle Analysis Guide

How to find and remove dead weight in this project.

## 1. Bundle Analyzer (visual treemap)

The project already has `@next/bundle-analyzer` wired up. Run:

```bash
pnpm analyze
# expands to: ANALYZE=true next build --webpack
```

This produces three HTML treemaps in `.next/analyze/`:
- **client.html** -- what ships to the browser (the one you care about most)
- **nodejs.html** -- server-side bundle
- **edge.html** -- edge runtime bundle

Open `client.html` in a browser and look for:
- Unexpectedly large chunks (click to drill in)
- Packages you didn't realize were client-side (e.g. `three`, `recharts`)
- Duplicate copies of the same library

## 2. Find Unused Dependencies

### Quick check with `depcheck`

```bash
# one-off, no install needed
pnpm dlx depcheck
```

This scans imports across the project and reports:
- **Unused dependencies** -- listed in package.json but never imported
- **Missing dependencies** -- imported but not in package.json
- **Unused devDependencies** -- dev packages with no references

> **Caveat**: depcheck can produce false positives for packages referenced indirectly (e.g. PostCSS plugins, type packages, CLI tools used in scripts). Always verify before removing.

### Manual verification for a specific package

```bash
# search for any import of a package
grep -r "from ['\"]package-name" src/ --include="*.ts" --include="*.tsx"

# also check config files
grep -r "package-name" next.config.ts postcss.config.mjs vitest.config.ts eslint.config.mjs
```

## 3. Find Dead Exports & Unused Code

### Using TypeScript compiler

```bash
# find unused exports with ts-prune (lightweight, no config)
pnpm dlx ts-prune | grep -v '(used in module)'
```

This lists every export that has zero importers. Focus on:
- `src/hooks/` -- unused hooks
- `src/components/` -- unused components
- `src/lib/` -- unused utility functions

### Manual search for a specific export

```bash
# check if a function/component is imported anywhere
grep -r "ComponentName\|functionName" src/ --include="*.ts" --include="*.tsx" | grep -v "export"
```

## 4. Find Unused Public Assets

Files in `public/` ship with every deployment even if nothing references them.

```bash
# list all files in public/
find public/ -type f

# for each file, check if it's referenced
grep -r "filename.svg" src/ --include="*.ts" --include="*.tsx"
```

Common culprits: Next.js starter SVGs (`file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg`).

## 5. Check for Heavy Client-Side Imports

Some packages are large and may not need to be in the client bundle:

```bash
# check what's being dynamically imported vs statically imported
grep -r "dynamic(" src/ --include="*.tsx" | head -20

# find static imports of known-heavy packages
grep -r "from ['\"]three" src/ --include="*.tsx" | grep -v "dynamic\|lazy"
grep -r "from ['\"]recharts" src/ --include="*.tsx"
grep -r "from ['\"]framer-motion" src/ --include="*.tsx"
```

Heavy packages should be dynamically imported (`next/dynamic` with `ssr: false`) or loaded behind `React.lazy()` + `Suspense`.

## 6. Check for Redundant Dependencies

Some packages overlap:
- **`autoprefixer`** is redundant with Tailwind CSS v4 (v4 includes vendor prefixing)
- **`@types/*`** packages belong in `devDependencies`, not `dependencies`
- Multiple charting libraries (`recharts` + `@unovis/*`) -- consolidate if possible

## 7. Identify Large Directories Not in `.gitignore`

```bash
# find the largest directories
du -sh */ | sort -rh | head -10

# check if large dirs are referenced in code
grep -r "directory-name" src/ --include="*.ts" --include="*.tsx"
```

## 8. Build Size Tracking

Compare build output before and after changes:

```bash
# before changes
pnpm build 2>&1 | tail -30 > /tmp/build-before.txt

# after changes
pnpm build 2>&1 | tail -30 > /tmp/build-after.txt

# compare
diff /tmp/build-before.txt /tmp/build-after.txt
```

Next.js prints route sizes and first-load JS for each page at the end of the build.

## 9. Checklist

When tree shaking, work through this list:

- [ ] Run `pnpm analyze` and review client.html treemap
- [ ] Run `pnpm dlx depcheck` for unused dependencies
- [ ] Run `pnpm dlx ts-prune` for unused exports
- [ ] Check `public/` for unreferenced assets
- [ ] Check for large non-code directories (`du -sh */`)
- [ ] Verify `@types/*` packages are in devDependencies
- [ ] Check PostCSS config for redundant plugins (autoprefixer with Tailwind v4)
- [ ] Look for static imports of heavy packages that should be dynamic
- [ ] Compare `pnpm build` output sizes before/after cleanup
- [ ] Run `pnpm test` to make sure nothing broke
