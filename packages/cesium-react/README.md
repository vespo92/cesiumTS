# @cesiumts/react

A React component library for CesiumJS - providing easy-to-use React components for 3D globe visualization.

## Installation

```bash
npm install @cesiumts/react cesium
# or
bun add @cesiumts/react cesium
```

## Quick Start

```tsx
import { CesiumViewer } from '@cesiumts/react';

function App() {
  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <CesiumViewer
        ionToken="your-cesium-ion-token"
        initialPosition={[-122.4194, 37.7749, 100000]} // San Francisco
        terrain={true}
        onReady={(viewer) => console.log('Cesium ready!', viewer)}
      />
    </div>
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `id` | `string` | `"cesium-container"` | Container element ID |
| `className` | `string` | `""` | CSS class name |
| `initialPosition` | `[lon, lat, height]` | US center | Initial camera position |
| `ionToken` | `string` | - | Cesium Ion access token |
| `terrain` | `boolean` | `false` | Enable 3D terrain |
| `imageryProvider` | `"osm" \| "bing" \| "arcgis" \| "none"` | `"osm"` | Base imagery layer |
| `kmlUrls` | `string[]` | `[]` | KML/KMZ files to load |
| `geoJsonUrls` | `string[]` | `[]` | GeoJSON files to load |
| `onReady` | `(viewer: Viewer) => void` | - | Called when viewer is ready |
| `onEntityClick` | `(entity?: Entity) => void` | - | Called when entity is clicked |

## Ref Methods

Access the viewer instance and helper methods via ref:

```tsx
import { useRef } from 'react';
import { CesiumViewer, CesiumViewerRef } from '@cesiumts/react';

function App() {
  const viewerRef = useRef<CesiumViewerRef>(null);

  const flyToNewYork = () => {
    viewerRef.current?.flyTo(-74.006, 40.7128, 50000);
  };

  return (
    <>
      <button onClick={flyToNewYork}>Fly to NYC</button>
      <CesiumViewer ref={viewerRef} />
    </>
  );
}
```

### Available Methods

- `flyTo(longitude, latitude, height?)` - Fly camera to location
- `loadKml(url)` - Load a KML/KMZ file
- `loadGeoJson(url)` - Load a GeoJSON file
- `clearDataSources()` - Remove all loaded data
- `zoomToData()` - Zoom to fit all loaded data
- `viewer` - Direct access to Cesium Viewer instance

## Next.js Usage

For Next.js, use dynamic import to avoid SSR issues:

```tsx
import dynamic from 'next/dynamic';

const CesiumViewer = dynamic(
  () => import('@cesiumts/react').then((mod) => mod.CesiumViewer),
  { ssr: false }
);
```

## Cesium Assets Setup

Copy Cesium's static assets to your public folder:

```bash
# Next.js / Vite
cp -r node_modules/cesium/Build/Cesium/Assets public/cesium/Assets
cp -r node_modules/cesium/Build/Cesium/Widgets public/cesium/Widgets
cp -r node_modules/cesium/Build/Cesium/Workers public/cesium/Workers
cp -r node_modules/cesium/Build/Cesium/ThirdParty public/cesium/ThirdParty
```

## Getting a Cesium Ion Token

1. Sign up at [cesium.com/ion](https://cesium.com/ion)
2. Go to Access Tokens
3. Create or copy your default token

The token is required for Cesium Ion services (terrain, geocoding, etc.). Basic OpenStreetMap imagery works without a token.

## License

Apache-2.0 - Same as CesiumJS
