# Session Reference: Next.js SWC Binary Recovery

## Project
Gabon Tech Store (Next.js 16.2.10, App Router, Tailwind CSS)

## Original failure
```
$ cd /home/gibson/gabon-tech-store && node --max-old-space-size=3072 node_modules/next/dist/bin/next build
Bus error (core dumped)
```

## Root cause
`npm install` timed out after 300s on a ~400 KB/s network. The `@next/swc-linux-x64-gnu` package was partially downloaded:

- **Good binary**: 130,306,224 bytes (~124 MB)
- **Truncated binary**: ~112 MB (segment at offset 0x780d710 with filesz 0x437018 extends to 0x7C44728, but file only 0x6B165B9 bytes)

## Diagnosis commands

```bash
# ldd crashes on truncated binary → SIGBUS, exit 135
ldd node_modules/@next/swc-linux-x64-gnu/next-swc.linux-x64-gnu.node

# readelf reveals segments beyond file
readelf -l node_modules/@next/swc-linux-x64-gnu/next-swc.linux-x64-gnu.node
```

## Recovery commands (exact)

```bash
# 1. Download from npm registry (43.2 MB compressed, ~108s at 407 KB/s)
curl -L --connect-timeout 30 --max-time 300 \
  -o /tmp/swc-gnu.tgz \
  "https://registry.npmjs.org/@next/swc-linux-x64-gnu/-/swc-linux-x64-gnu-16.2.10.tgz"

# 2. Remove truncated directory
rm -rf node_modules/@next/swc-linux-x64-gnu

# 3. Extract fresh binary
mkdir -p node_modules/@next/swc-linux-x64-gnu
tar -xzf /tmp/swc-gnu.tgz -C node_modules/@next/swc-linux-x64-gnu --strip-components=1

# 4. Verify
ldd node_modules/@next/swc-linux-x64-gnu/next-swc.linux-x64-gnu.node
# → exit 0

# 5. Build
node --max-old-space-size=3072 node_modules/next/dist/bin/next build
# → ✓ Compiled successfully in 11.6s
# → 6 pages, 5 routes
```

## Lint result
```bash
npm run lint
# → 0 errors, 2 warnings (unused variables: longDescription, specs)
```

## Dev server
```bash
node --max-old-space-size=3072 node_modules/next/dist/bin/next dev -p 3000
# → http://localhost:3000
# → ✓ Ready in 2.9s
```
