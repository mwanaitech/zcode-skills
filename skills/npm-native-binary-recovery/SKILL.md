---
name: npm-native-binary-recovery
description: Diagnose and recover truncated native binaries (.node files, Rust/Go compiled) after an interrupted npm install on slow networks. Covers the SIGBUS diagnostic pattern and the direct-download recovery workflow.
version: 1.0.0
author: agent
platforms:
  - linux
triggers:
  - npm install times out
  - SIGBUS / Bus error during next build or other Node.js native module usage
  - ldd crashes with exit code 135 on a .node file
  - readelf -l shows LOAD segment extending beyond file size
  - next build crashes with Bus error but next dev works
  - Truncated native binary after npm install
---

# npm-native-binary-recovery

## Problem

When `npm install` runs on a slow network (e.g. ~400 KB/s), it can **time out** partway through downloading a large native binary package. The partially-downloaded `.node` file is truncated, but npm does not clean it up. This causes:

- `SIGBUS` (exit code 135) when Node.js or `ldd` tries to load the truncated ELF
- `next build` crashes with `Bus error (core dumped)` while `next dev` works (different code path or SWC version)
- Other native modules (`sharp`, `esbuild`, `node-sass`, etc.) similarly affected

## Diagnosis

### Step 1 — Check if ldd crashes on the .node file

```bash
ldd <path-to>/next-swc.linux-x64-gnu.node
```

If it exits with code 135 (SIGBUS), the binary is truncated or corrupted at the kernel/ELF level.

### Step 2 — Inspect ELF segments

```bash
readelf -l <path-to>/next-swc.linux-x64-gnu.node
```

Look for LOAD segments where `offset + filesz` exceeds the actual file size. Example of a corrupted binary:

```
  LOAD  0x0780d710 0x... 0x... 0x437018 0x43f350 RW ...
```

If `0x780d710 + 0x437018 = 0x7C44728` > actual file size (e.g. `112MB`), the binary is **truncated**.

### Step 3 — Compare file size

A healthy `next-swc.linux-x64-gnu.node` for Next.js 16.2.10 is **~130 MB** (130,306,224 bytes). A truncated one may be ~112 MB.

## Recovery Procedure

### 1. Find the exact package version

```bash
# For Next.js SWC:
node -e "console.log(require('next/package.json').version)"
# → "16.2.10"
```

### 2. Download the tarball directly via curl

```bash
# For @next/swc-linux-x64-gnu:
curl -L --connect-timeout 30 --max-time 300 \
  -o /tmp/swc-gnu.tgz \
  "https://registry.npmjs.org/@next/swc-linux-x64-gnu/-/swc-linux-x64-gnu-<VERSION>.tgz"
```

Use `--max-time 300` (5 minutes) — slow networks need it.

### 3. Extract into node_modules

```bash
cd <project-root>
mkdir -p node_modules/<scope>/<package>
tar -xzf /tmp/swc-gnu.tgz \
  -C node_modules/<scope>/<package> \
  --strip-components=1
```

Example for Next.js SWC:

```bash
mkdir -p node_modules/@next/swc-linux-x64-gnu
tar -xzf /tmp/swc-gnu.tgz \
  -C node_modules/@next/swc-linux-x64-gnu \
  --strip-components=1
```

### 4. Verify

```bash
ldd node_modules/<scope>/<package>/<binary>.node
# → exit 0, all dependencies resolved

node --max-old-space-size=3072 node_modules/next/dist/bin/next build
# → "✓ Compiled successfully"
```

## Pitfalls

- **Don't re-run `npm install` from scratch** — it will also time out on the same slow network. Patching the single truncated package is much faster.
- **Don't use `--prefer-offline` with a corrupted npm cache** — the cached `.tgz` may also be truncated (`npm cache ls | grep swc` to check). Clean the cache first if you suspect this.
- **SWC binary growth** — The compressed `.tgz` is ~43 MB but the extracted `.node` is ~130 MB. Normal.
- **After fixing, always verify with `ldd` first**, before running the full build. Saves time.
- **Version pinning** — The version in the download URL must match exactly (e.g. `16.2.10` is not `16.2.6`).

## Related

- `@next/swc-linux-x64-gnu` — glibc-based Linux x64
- `@next/swc-linux-x64-musl` — musl-based Linux x64 (Alpine)
- The same pattern applies to any npm package with native binaries: remove the truncated directory, download the `.tgz` from registry.npmjs.org, extract manually.
