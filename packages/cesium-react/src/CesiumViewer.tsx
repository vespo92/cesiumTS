"use client";

import {
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
  useState,
} from "react";
import type { ReactNode } from "react";

// Cesium types - imported dynamically to avoid SSR issues
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

// Default camera position (continental US)
const DEFAULT_POSITION: [number, number, number] = [-98.5795, 39.8283, 5000000];

export const CesiumViewer = forwardRef<CesiumViewerRef, CesiumViewerProps>(
  (
    {
      id = "cesium-container",
      className = "",
      initialPosition = DEFAULT_POSITION,
      ionToken,
      terrain = false,
      imageryProvider = "osm",
      kmlUrls = [],
      geoJsonUrls = [],
      onReady,
      onEntityClick,
      children,
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const viewerRef = useRef<CesiumViewer | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Expose viewer methods via ref
    useImperativeHandle(ref, () => ({
      viewer: viewerRef.current,
      flyTo: (longitude: number, latitude: number, height = 10000) => {
        if (viewerRef.current) {
          import("cesium").then(({ Cartesian3 }) => {
            viewerRef.current?.camera.flyTo({
              destination: Cartesian3.fromDegrees(longitude, latitude, height),
            });
          });
        }
      },
      loadKml: async (url: string) => {
        if (!viewerRef.current) throw new Error("Viewer not initialized");
        const { KmlDataSource } = await import("cesium");
        const dataSource = await KmlDataSource.load(url);
        viewerRef.current.dataSources.add(dataSource);
        return dataSource;
      },
      loadGeoJson: async (url: string) => {
        if (!viewerRef.current) throw new Error("Viewer not initialized");
        const { GeoJsonDataSource } = await import("cesium");
        const dataSource = await GeoJsonDataSource.load(url);
        viewerRef.current.dataSources.add(dataSource);
        return dataSource;
      },
      clearDataSources: () => {
        viewerRef.current?.dataSources.removeAll();
      },
      zoomToData: async () => {
        if (viewerRef.current && viewerRef.current.dataSources.length > 0) {
          const dataSource = viewerRef.current.dataSources.get(0);
          if (dataSource) {
            await viewerRef.current.zoomTo(dataSource);
          }
        }
      },
    }));

    useEffect(() => {
      let viewer: CesiumViewer | null = null;

      const initCesium = async () => {
        try {
          // Dynamic import to avoid SSR issues
          const Cesium = await import("cesium");

          // Set Ion token if provided
          if (ionToken) {
            Cesium.Ion.defaultAccessToken = ionToken;
          }

          // Configure base URL for Cesium assets
          (window as unknown as { CESIUM_BASE_URL: string }).CESIUM_BASE_URL = "/cesium/";

          if (!containerRef.current) return;

          // Create viewer with optimized settings
          viewer = new Cesium.Viewer(containerRef.current, {
            animation: false,
            baseLayerPicker: false,
            fullscreenButton: false,
            geocoder: false,
            homeButton: true,
            infoBox: true,
            sceneModePicker: true,
            selectionIndicator: true,
            timeline: false,
            navigationHelpButton: false,
            scene3DOnly: false,
            shouldAnimate: true,
          });

          // Set imagery provider
          if (imageryProvider !== "none") {
            const imageryLayers = viewer.imageryLayers;
            imageryLayers.removeAll();

            // Use OSM as default - Bing requires API key
            const provider = new Cesium.OpenStreetMapImageryProvider({
              url: "https://tile.openstreetmap.org/",
            });
            imageryLayers.addImageryProvider(provider);
          }

          // Enable terrain if requested
          if (terrain && ionToken) {
            viewer.terrainProvider = await Cesium.CesiumTerrainProvider.fromIonAssetId(1, {});
          }

          // Set initial camera position
          viewer.camera.setView({
            destination: Cesium.Cartesian3.fromDegrees(
              initialPosition[0],
              initialPosition[1],
              initialPosition[2]
            ),
          });

          // Set up entity click handler
          if (onEntityClick) {
            viewer.screenSpaceEventHandler.setInputAction(
              (click: { position: { x: number; y: number } }) => {
                const cartesian = new Cesium.Cartesian2(click.position.x, click.position.y);
                const pickedObject = viewer?.scene.pick(cartesian);
                const entity = pickedObject?.id as CesiumEntity | undefined;
                onEntityClick(entity);
              },
              Cesium.ScreenSpaceEventType.LEFT_CLICK
            );
          }

          // Load initial KML files
          for (const url of kmlUrls) {
            try {
              const dataSource = await Cesium.KmlDataSource.load(url);
              viewer.dataSources.add(dataSource);
            } catch (e) {
              console.error(`Failed to load KML: ${url}`, e);
            }
          }

          // Load initial GeoJSON files
          for (const url of geoJsonUrls) {
            try {
              const dataSource = await Cesium.GeoJsonDataSource.load(url);
              viewer.dataSources.add(dataSource);
            } catch (e) {
              console.error(`Failed to load GeoJSON: ${url}`, e);
            }
          }

          // Zoom to data if any loaded
          if ((kmlUrls.length > 0 || geoJsonUrls.length > 0) && viewer.dataSources.length > 0) {
            const firstDataSource = viewer.dataSources.get(0);
            if (firstDataSource) {
              viewer.zoomTo(firstDataSource);
            }
          }

          viewerRef.current = viewer;
          setIsLoading(false);
          onReady?.(viewer);
        } catch (e) {
          console.error("Failed to initialize Cesium:", e);
          setError(e instanceof Error ? e.message : "Failed to initialize Cesium");
          setIsLoading(false);
        }
      };

      initCesium();

      // Cleanup
      return () => {
        if (viewer && !viewer.isDestroyed()) {
          viewer.destroy();
        }
        viewerRef.current = null;
      };
    }, []); // Only run once on mount

    return (
      <div className={`relative w-full h-full ${className}`}>
        <div
          id={id}
          ref={containerRef}
          className="w-full h-full"
          style={{ minHeight: "400px" }}
        />
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50">
            <div className="text-white">Loading Cesium...</div>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-900/50">
            <div className="text-white">Error: {error}</div>
          </div>
        )}
        {children}
      </div>
    );
  }
);

CesiumViewer.displayName = "CesiumViewer";

export default CesiumViewer;
