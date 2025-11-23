var __create = Object.create;
var __getProtoOf = Object.getPrototypeOf;
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
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
var __moduleCache = /* @__PURE__ */ new WeakMap;
var __toCommonJS = (from) => {
  var entry = __moduleCache.get(from), desc;
  if (entry)
    return entry;
  entry = __defProp({}, "__esModule", { value: true });
  if (from && typeof from === "object" || typeof from === "function")
    __getOwnPropNames(from).map((key) => !__hasOwnProp.call(entry, key) && __defProp(entry, key, {
      get: () => from[key],
      enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
    }));
  __moduleCache.set(from, entry);
  return entry;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, {
      get: all[name],
      enumerable: true,
      configurable: true,
      set: (newValue) => all[name] = () => newValue
    });
};

// src/index.ts
var exports_src = {};
__export(exports_src, {
  CesiumViewer: () => CesiumViewer
});
module.exports = __toCommonJS(exports_src);

// src/CesiumViewer.tsx
var import_react = require("react");
var jsx_dev_runtime = require("react/jsx-dev-runtime");
"use client";
var DEFAULT_POSITION = [-98.5795, 39.8283, 5000000];
var CesiumViewer = import_react.forwardRef(({
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
  const containerRef = import_react.useRef(null);
  const viewerRef = import_react.useRef(null);
  const [isLoading, setIsLoading] = import_react.useState(true);
  const [error, setError] = import_react.useState(null);
  import_react.useImperativeHandle(ref, () => ({
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
  import_react.useEffect(() => {
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
  return /* @__PURE__ */ jsx_dev_runtime.jsxDEV("div", {
    className: `relative w-full h-full ${className}`,
    children: [
      /* @__PURE__ */ jsx_dev_runtime.jsxDEV("div", {
        id,
        ref: containerRef,
        className: "w-full h-full",
        style: { minHeight: "400px" }
      }, undefined, false, undefined, this),
      isLoading && /* @__PURE__ */ jsx_dev_runtime.jsxDEV("div", {
        className: "absolute inset-0 flex items-center justify-center bg-gray-900/50",
        children: /* @__PURE__ */ jsx_dev_runtime.jsxDEV("div", {
          className: "text-white",
          children: "Loading Cesium..."
        }, undefined, false, undefined, this)
      }, undefined, false, undefined, this),
      error && /* @__PURE__ */ jsx_dev_runtime.jsxDEV("div", {
        className: "absolute inset-0 flex items-center justify-center bg-red-900/50",
        children: /* @__PURE__ */ jsx_dev_runtime.jsxDEV("div", {
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
