import type { ReactNode } from "react";
type CesiumViewer = import("cesium").Viewer;
type CesiumEntity = import("cesium").Entity;
type CesiumDataSource = import("cesium").DataSource;
export interface CesiumViewerProps {
    /** Container ID for the viewer */
    id?: string;
    /** CSS class name for the container */
    className?: string;
    /** Initial camera position [longitude, latitude, height] */
    initialPosition?: [number, number, number];
    /** Cesium Ion access token (optional, for terrain/imagery) */
    ionToken?: string;
    /** Enable terrain */
    terrain?: boolean;
    /** Base layer imagery provider (default: OpenStreetMap) */
    imageryProvider?: "osm" | "bing" | "arcgis" | "none";
    /** KML/KMZ files to load on mount */
    kmlUrls?: string[];
    /** GeoJSON files to load on mount */
    geoJsonUrls?: string[];
    /** Callback when viewer is ready */
    onReady?: (viewer: CesiumViewer) => void;
    /** Callback when an entity is clicked */
    onEntityClick?: (entity: CesiumEntity | undefined) => void;
    /** Children to render inside the viewer container */
    children?: ReactNode;
}
export interface CesiumViewerRef {
    /** The Cesium Viewer instance */
    viewer: CesiumViewer | null;
    /** Fly to a specific location */
    flyTo: (longitude: number, latitude: number, height?: number) => void;
    /** Load a KML/KMZ file */
    loadKml: (url: string) => Promise<CesiumDataSource>;
    /** Load a GeoJSON file */
    loadGeoJson: (url: string) => Promise<CesiumDataSource>;
    /** Clear all data sources */
    clearDataSources: () => void;
    /** Zoom to fit all loaded data */
    zoomToData: () => void;
}
export declare const CesiumViewer: import("react").ForwardRefExoticComponent<CesiumViewerProps & import("react").RefAttributes<CesiumViewerRef>>;
export default CesiumViewer;
