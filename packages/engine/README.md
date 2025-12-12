# @vespo/cesium-engine

TypeScript 3D rendering engine for creating interactive globes and maps. GPU-optimized for modern hardware including Apple Silicon.

## Features

- WebGL-based 3D globe rendering
- Terrain and imagery streaming
- GLSL shader pipeline for GPU acceleration
- Full TypeScript type safety
- Optimized for Apple M-series GPUs

## Installation

```bash
npm install @vespo/cesium-engine
# or
bun add @vespo/cesium-engine
```

## Usage

```typescript
import { Viewer } from '@vespo/cesium-engine';

const viewer = new Viewer('cesiumContainer');
```

## License

Apache 2.0 - Fork of CesiumJS with TypeScript conversion
