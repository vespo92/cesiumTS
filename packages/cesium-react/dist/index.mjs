var __create = Object.create;
var __getProtoOf = Object.getPrototypeOf;
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __toESM = (mod, isNodeMode, target) => {
  target = mod != null ? __create(__getProtoOf(mod)) : {};
  const to = isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target;
  for (let key of __getOwnPropNames(mod))
    if (!__hasOwnProp.call(to, key))
      __defProp(to, key, {
        get: () => mod[key],
        enumerable: true
      });
  return to;
};
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined")
    return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});

// src/CesiumViewer.tsx
import {
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
  useState
} from "react";
import { jsxDEV } from "react/jsx-dev-runtime";
"use client";
var DEFAULT_POSITION = [-98.5795, 39.8283, 5000000];
var CesiumViewer = forwardRef(({
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
  children
}, ref) => {
  const containerRef = useRef(null);
  const viewerRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  useImperativeHandle(ref, () => ({
    viewer: viewerRef.current,
    flyTo: (longitude, latitude, height = 1e4) => {
      if (viewerRef.current) {
        import("cesium").then(({ Cartesian3 }) => {
          viewerRef.current?.camera.flyTo({
            destination: Cartesian3.fromDegrees(longitude, latitude, height)
          });
        });
      }
    },
    loadKml: async (url) => {
      if (!viewerRef.current)
        throw new Error("Viewer not initialized");
      const { KmlDataSource } = await import("cesium");
      const dataSource = await KmlDataSource.load(url);
      viewerRef.current.dataSources.add(dataSource);
      return dataSource;
    },
    loadGeoJson: async (url) => {
      if (!viewerRef.current)
        throw new Error("Viewer not initialized");
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
    }
  }));
  useEffect(() => {
    let viewer = null;
    const initCesium = async () => {
      try {
        const Cesium = await import("cesium");
        if (ionToken) {
          Cesium.Ion.defaultAccessToken = ionToken;
        }
        window.CESIUM_BASE_URL = "/cesium/";
        if (!containerRef.current)
          return;
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
          shouldAnimate: true
        });
        if (imageryProvider !== "none") {
          const imageryLayers = viewer.imageryLayers;
          imageryLayers.removeAll();
          const provider = new Cesium.OpenStreetMapImageryProvider({
            url: "https://tile.openstreetmap.org/"
          });
          imageryLayers.addImageryProvider(provider);
        }
        if (terrain && ionToken) {
          viewer.terrainProvider = await Cesium.CesiumTerrainProvider.fromIonAssetId(1, {});
        }
        viewer.camera.setView({
          destination: Cesium.Cartesian3.fromDegrees(initialPosition[0], initialPosition[1], initialPosition[2])
        });
        if (onEntityClick) {
          viewer.screenSpaceEventHandler.setInputAction((click) => {
            const cartesian = new Cesium.Cartesian2(click.position.x, click.position.y);
            const pickedObject = viewer?.scene.pick(cartesian);
            const entity = pickedObject?.id;
            onEntityClick(entity);
          }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
        }
        for (const url of kmlUrls) {
          try {
            const dataSource = await Cesium.KmlDataSource.load(url);
            viewer.dataSources.add(dataSource);
          } catch (e) {
            console.error(`Failed to load KML: ${url}`, e);
          }
        }
        for (const url of geoJsonUrls) {
          try {
            const dataSource = await Cesium.GeoJsonDataSource.load(url);
            viewer.dataSources.add(dataSource);
          } catch (e) {
            console.error(`Failed to load GeoJSON: ${url}`, e);
          }
        }
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
    return () => {
      if (viewer && !viewer.isDestroyed()) {
        viewer.destroy();
      }
      viewerRef.current = null;
    };
  }, []);
  return /* @__PURE__ */ jsxDEV("div", {
    className: `relative w-full h-full ${className}`,
    children: [
      /* @__PURE__ */ jsxDEV("div", {
        id,
        ref: containerRef,
        className: "w-full h-full",
        style: { minHeight: "400px" }
      }, undefined, false, undefined, this),
      isLoading && /* @__PURE__ */ jsxDEV("div", {
        className: "absolute inset-0 flex items-center justify-center bg-gray-900/50",
        children: /* @__PURE__ */ jsxDEV("div", {
          className: "text-white",
          children: "Loading Cesium..."
        }, undefined, false, undefined, this)
      }, undefined, false, undefined, this),
      error && /* @__PURE__ */ jsxDEV("div", {
        className: "absolute inset-0 flex items-center justify-center bg-red-900/50",
        children: /* @__PURE__ */ jsxDEV("div", {
          className: "text-white",
          children: [
            "Error: ",
            error
          ]
        }, undefined, true, undefined, this)
      }, undefined, false, undefined, this),
      children
    ]
  }, undefined, true, undefined, this);
});
CesiumViewer.displayName = "CesiumViewer";
export {
  CesiumViewer
};
