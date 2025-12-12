# CesiumTS Architecture

## Turbo Monorepo Structure

This is a **modern TypeScript monorepo** powered by Turbo for fast, cached builds.

```
cesiumTS/
├── packages/
│   ├── engine/          # @vespo/cesium-engine - Core 3D rendering
│   └── widgets/         # @vespo/cesium-widgets - UI components
├── turbo.json          # Turbo pipeline configuration
└── package.json        # Root workspace config
```

## Packages

### @vespo/cesium-engine

**GPU-optimized 3D rendering engine** for globes and maps.

- WebGL-based rendering pipeline
- GLSL shader compilation
- Terrain and imagery streaming
- Full TypeScript type safety
- Optimized for Apple Silicon (M-series GPUs)

**Key directories:**
- `Source/Core/` - Core math, geometry, utilities
- `Source/Scene/` - 3D scene management
- `Source/Renderer/` - WebGL abstraction
- `Source/Shaders/` - GLSL shaders (compiled to JS)
- `Source/Workers/` - Web Workers for threading

### @vespo/cesium-widgets

**UI widget library** for map applications.

- Geocoder, timeline, animation controls
- Info boxes and selection indicators
- Customizable components
- Works with @vespo/cesium-engine

## Build System

### Turbo Tasks

```bash
turbo run build        # Build all packages (parallelized)
turbo run dev          # Development mode with watch
turbo run typecheck    # TypeScript validation
turbo run test         # Run tests
turbo run clean        # Clean build artifacts
```

### Dependency Graph

```
@vespo/cesium (meta-package)
  ├── @vespo/cesium-engine
  └── @vespo/cesium-widgets
        └── @vespo/cesium-engine (workspace dependency)
```

## Publishing Strategy

Publish as **separate npm packages**:

1. `@vespo/cesium-engine` - Core engine (independent)
2. `@vespo/cesium-widgets` - Widgets (depends on engine)
3. `@vespo/cesium` - Meta-package (depends on both)

**Benefits:**
- Tree-shakeable imports
- Smaller bundles for apps that only need engine
- Platform-specific optimizations per package
- Faster Turbo cache hits

## GPU Optimization

### Apple Silicon (M-series)

- Native ARM64 builds
- Metal API compatibility (via WebGL)
- Optimized shader compilation
- Memory-efficient texture streaming

### General GPU Performance

- GLSL shader pipeline
- Web Workers for parallel processing
- Efficient geometry batching
- LOD (Level of Detail) management

## TypeScript Conversion

This fork converts **all** CesiumJS source from JavaScript to TypeScript:

- **Before:** JS + generated `.d.ts` files
- **After:** Native `.ts` source with real types

**Advantages:**
- Compile-time error detection
- Better IDE autocomplete
- Refactoring safety
- No JSDoc → types impedance mismatch

## Development Workflow

### Making Changes

```bash
# Start development mode
bun run dev

# Make changes to packages/engine or packages/widgets
# Turbo automatically rebuilds changed packages

# Type check before commit
bun run typecheck
```

### Publishing Updates

```bash
# Bump versions in package.json files
# Build all packages
bun run build

# Publish each package
cd packages/engine
npm publish --access public

cd ../widgets
npm publish --access public
```

## Why Turbo?

- **Caching:** Never rebuild the same code twice
- **Parallelization:** Build packages concurrently
- **Incremental:** Only rebuild what changed
- **Distributed:** Cache shared across team (optional)

## Future Enhancements

- [ ] Native ARM64 builds for engine
- [ ] WASM shader compilation
- [ ] GPU-specific optimizations (Metal, Vulkan)
- [ ] Smaller bundle sizes via code splitting
- [ ] Progressive web app support
