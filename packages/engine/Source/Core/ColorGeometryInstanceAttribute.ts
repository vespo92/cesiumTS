import Color from "./Color.js";
import ComponentDatatype from "./ComponentDatatype.js";
import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";

/**
 * Value and type information for per-instance geometry color.
 *
 * @alias ColorGeometryInstanceAttribute
 *
 * @example
 * const instance = new Cesium.GeometryInstance({
 *   geometry : Cesium.BoxGeometry.fromDimensions({
 *     dimensions : new Cesium.Cartesian3(1000000.0, 1000000.0, 500000.0)
 *   }),
 *   modelMatrix : Cesium.Matrix4.multiplyByTranslation(Cesium.Transforms.eastNorthUpToFixedFrame(
 *     Cesium.Cartesian3.fromDegrees(0.0, 0.0)), new Cesium.Cartesian3(0.0, 0.0, 1000000.0), new Cesium.Matrix4()),
 *   id : 'box',
 *   attributes : {
 *     color : new Cesium.ColorGeometryInstanceAttribute(red, green, blue, alpha)
 *   }
 * });
 *
 * @see GeometryInstance
 * @see GeometryInstanceAttribute
 */
class ColorGeometryInstanceAttribute {
  /**
   * The values for the attributes stored in a typed array.
   */
  value: Uint8Array;

  /**
   * Creates a new ColorGeometryInstanceAttribute.
   * @param red - The red component. Default is 1.0.
   * @param green - The green component. Default is 1.0.
   * @param blue - The blue component. Default is 1.0.
   * @param alpha - The alpha component. Default is 1.0.
   */
  constructor(
    red: number = 1.0,
    green: number = 1.0,
    blue: number = 1.0,
    alpha: number = 1.0,
  ) {
    this.value = new Uint8Array([
      Color.floatToByte(red),
      Color.floatToByte(green),
      Color.floatToByte(blue),
      Color.floatToByte(alpha),
    ]);
  }

  /**
   * The datatype of each component in the attribute, e.g., individual elements in
   * {@link ColorGeometryInstanceAttribute#value}.
   * @default ComponentDatatype.UNSIGNED_BYTE
   */
  get componentDatatype(): number {
    return ComponentDatatype.UNSIGNED_BYTE;
  }

  /**
   * The number of components in the attributes, i.e., {@link ColorGeometryInstanceAttribute#value}.
   * @default 4
   */
  get componentsPerAttribute(): number {
    return 4;
  }

  /**
   * When true and componentDatatype is an integer format,
   * indicate that the components should be mapped to the range [0, 1] (unsigned)
   * or [-1, 1] (signed) when they are accessed as floating-point for rendering.
   * @default true
   */
  get normalize(): boolean {
    return true;
  }

  /**
   * Creates a new {@link ColorGeometryInstanceAttribute} instance given the provided {@link Color}.
   *
   * @param color - The color.
   * @returns The new {@link ColorGeometryInstanceAttribute} instance.
   *
   * @example
   * const instance = new Cesium.GeometryInstance({
   *   geometry : geometry,
   *   attributes : {
   *     color : Cesium.ColorGeometryInstanceAttribute.fromColor(Cesium.Color.CORNFLOWERBLUE),
   *   }
   * });
   */
  static fromColor(color: Color): ColorGeometryInstanceAttribute {
    //>>includeStart('debug', pragmas.debug);
    if (!defined(color)) {
      throw new DeveloperError("color is required.");
    }
    //>>includeEnd('debug');

    return new ColorGeometryInstanceAttribute(
      color.red,
      color.green,
      color.blue,
      color.alpha,
    );
  }

  /**
   * Converts a color to a typed array that can be used to assign a color attribute.
   *
   * @param color - The color.
   * @param result - The array to store the result in, if undefined a new instance will be created.
   * @returns The modified result parameter or a new instance if result was undefined.
   *
   * @example
   * const attributes = primitive.getGeometryInstanceAttributes('an id');
   * attributes.color = Cesium.ColorGeometryInstanceAttribute.toValue(Cesium.Color.AQUA, attributes.color);
   */
  static toValue(color: Color, result?: Uint8Array): Uint8Array {
    //>>includeStart('debug', pragmas.debug);
    if (!defined(color)) {
      throw new DeveloperError("color is required.");
    }
    //>>includeEnd('debug');

    if (!defined(result)) {
      return new Uint8Array(color.toBytes());
    }
    return color.toBytes(result!);
  }

  /**
   * Compares the provided ColorGeometryInstanceAttributes and returns
   * true if they are equal, false otherwise.
   *
   * @param left - The first ColorGeometryInstanceAttribute.
   * @param right - The second ColorGeometryInstanceAttribute.
   * @returns true if left and right are equal, false otherwise.
   */
  static equals(
    left?: ColorGeometryInstanceAttribute,
    right?: ColorGeometryInstanceAttribute,
  ): boolean {
    return (
      left === right ||
      (defined(left) &&
        defined(right) &&
        left!.value[0] === right!.value[0] &&
        left!.value[1] === right!.value[1] &&
        left!.value[2] === right!.value[2] &&
        left!.value[3] === right!.value[3])
    );
  }
}

export default ColorGeometryInstanceAttribute;
