# CesiumTS - TypeScript Fork of CesiumJS

> **🚀 TypeScript-first fork** of the official CesiumJS library, converted from JavaScript to TypeScript for improved type safety and developer experience.

[![Original Build Status](https://github.com/CesiumGS/cesium/actions/workflows/dev.yml/badge.svg)](https://github.com/CesiumGS/cesium/actions/workflows/dev.yml)
[![npm](https://img.shields.io/npm/v/@vespo/cesium)](https://www.npmjs.com/package/@vespo/cesium)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](http://www.apache.org/licenses/LICENSE-2.0.html)

![Cesium](https://github.com/CesiumGS/cesium/wiki/logos/Cesium_Logo_Color.jpg)

## 🎯 About This Fork

This is a **TypeScript conversion** of [CesiumJS](https://github.com/CesiumGS/cesium) - a JavaScript library for creating 3D globes and 2D maps in a web browser without a plugin.

**Key Differences from Official CesiumJS:**
- ✅ **Full TypeScript source** instead of JavaScript + `.d.ts` files
- ✅ **Compile-time type safety** for 3D graphics and geospatial operations
- ✅ **Better IDE support** with real types, not JSDoc-generated definitions
- ✅ **Improved developer experience** for TypeScript-first projects

**Original CesiumJS Features:**
- Uses WebGL for hardware-accelerated graphics
- Cross-platform and cross-browser compatible
- Designed for robust interoperability and scaling for massive datasets
- Built on open formats for geospatial visualization

---

[**Examples**](https://sandcastle.cesium.com/) :earth_asia: [**Docs**](https://cesium.com/learn/cesiumjs-learn/) :earth_americas: [**Website**](https://cesium.com/cesiumjs) :earth_africa: [**Forum**](https://community.cesium.com/) :earth_asia: [**User Stories**](https://cesium.com/user-stories/)

---

## :rocket: Get started

### Installation

Install the TypeScript fork via npm:

```sh
npm install @vespo/cesium --save
```

Or using Bun (faster alternative):

```sh
bun add @vespo/cesium
```

### Usage

Import and use CesiumTS in your TypeScript app with full type safety:

```typescript
import { Viewer } from "@vespo/cesium";
import "@vespo/cesium/Build/Cesium/Widgets/widgets.css";

const viewer = new Viewer("cesiumContainer");
```

Import individual modules to benefit from tree shaking optimizations:

```typescript
import { Cartesian3, Color } from "@vespo/cesium";
```

### Scoped Packages

This fork maintains the modular structure with scoped packages:

- [`@cesium/engine`](./packages/engine/README.md) - CesiumJS's core, rendering, and data APIs
- [`@cesium/widgets`](./packages/widgets/README.md) - A widgets library for use with CesiumJS

### What next?

See our [Quickstart Guide](https://cesium.com/learn/cesiumjs-learn/cesiumjs-quickstart/) for more information on getting a CesiumJS app up and running.

Instructions for serving local data are in the CesiumJS
[Offline Guide](./Documentation/OfflineGuide/README.md).

Interested in contributing? See [CONTRIBUTING.md](CONTRIBUTING.md). :heart:

## 📦 Publishing

### Build for Production

```sh
bun run build-release
```

### Publish to npm

```sh
# Login to npm (first time only)
npm login

# Publish the package
npm publish --access public

# Or publish with Bun
bun publish --access public
```

### Version Management

Follow semantic versioning with the `-vespo` suffix:
- Patch: `1.135.0-vespo.1` → `1.135.0-vespo.2`
- Minor upstream sync: `1.135.0-vespo.1` → `1.136.0-vespo.1`
- Major: `1.135.0-vespo.1` → `2.0.0-vespo.1`

## 🔄 Syncing with Upstream

To pull updates from the official CesiumJS:

```sh
# Add upstream remote (first time only)
git remote add upstream https://github.com/CesiumGS/cesium.git

# Fetch upstream changes
git fetch upstream

# Merge upstream main (requires manual TypeScript conversion)
git merge upstream/main

# Resolve conflicts and re-apply TypeScript conversions
```

## 🛠️ Development

### Build

```sh
bun install
bun run build
```

### Watch Mode

```sh
bun run bun:dev
```

### Type Check

```sh
bun run bun:typecheck
```

## :green_book: License

[Apache 2.0](http://www.apache.org/licenses/LICENSE-2.0.html). CesiumJS is free for both commercial and non-commercial use.

**This fork maintains the same Apache 2.0 license** as the original CesiumJS project. All credit goes to the original CesiumGS team and contributors.

## :earth_americas: Where does the Global 3D Content come from?

The Cesium platform follows an [open-core business model](https://cesium.com/why-cesium/open-ecosystem/cesium-business-model/) with open source runtime engines such as CesiumJS and optional commercial subscription to Cesium ion.

CesiumJS can stream [3D content such as terrain, imagery, and 3D Tiles from the commercial Cesium ion platform](https://cesium.com/platform/cesium-ion/content/) alongside open standards from other offline or online services. We provide Cesium ion as the quickest option for all users to get up and running, but you are free to use any combination of content sources with CesiumJS that you please.

Bring your own data for tiling, hosting, and streaming from Cesium ion. [Using Cesium ion](https://cesium.com/ion/signup/) helps support CesiumJS development.

## :white_check_mark: Features

- Stream in 3D Tiles and other standard formats from Cesium ion or another source
- Visualize and analyze on a high-precision WGS84 globe
- Share with users on desktop or mobile

See more in the [CesiumJS Features Checklist](https://github.com/CesiumGS/cesium/wiki/CesiumJS-Features-Checklist).
