# @vespo/cesium-widgets

TypeScript UI widget components for 3D globe applications. Provides ready-to-use controls, dialogs, and UI elements.

## Features

- Full TypeScript widget library
- Geocoder, timeline, animation controls
- Info boxes and selection indicators  
- Customizable UI components
- Works seamlessly with @vespo/cesium-engine

## Installation

```bash
npm install @vespo/cesium-widgets @vespo/cesium-engine
# or
bun add @vespo/cesium-widgets @vespo/cesium-engine
```

## Usage

```typescript
import { Viewer } from '@vespo/cesium-engine';
import '@vespo/cesium-widgets/Source/widgets.css';

const viewer = new Viewer('cesiumContainer', {
  timeline: true,
  animation: true
});
```

## License

Apache 2.0 - Fork of CesiumJS with TypeScript conversion
