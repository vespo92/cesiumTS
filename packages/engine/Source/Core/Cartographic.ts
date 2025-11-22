import Cartesian3 from "./Cartesian3.js";
import Check from "./Check.js";
import defined from "./defined.js";
import CesiumMath from "./Math.js";
import scaleToGeodeticSurface from "./scaleToGeodeticSurface.js";

/**
 * Interface representing an Ellipsoid-like object for geographic coordinate conversion.
 * Used to avoid circular dependency with the Ellipsoid class.
 */
interface EllipsoidLike {
  oneOverRadii: Cartesian3;
  oneOverRadiiSquared: Cartesian3;
  _centerToleranceSquared: number;
}

// Scratch variables for fromCartesian calculations
const cartesianToCartographicN = new Cartesian3();
const cartesianToCartographicP = new Cartesian3();
const cartesianToCartographicH = new Cartesian3();

/**
 * A position defined by longitude, latitude, and height.
 * @alias Cartographic
 */
class Cartographic {
  /**
   * The longitude, in radians.
   */
  longitude: number;

  /**
   * The latitude, in radians.
   */
  latitude: number;

  /**
   * The height, in meters, above the ellipsoid.
   */
  height: number;

  /**
   * Creates a new Cartographic instance.
   * @param longitude - The longitude, in radians. Default is 0.0.
   * @param latitude - The latitude, in radians. Default is 0.0.
   * @param height - The height, in meters, above the ellipsoid. Default is 0.0.
   *
   * @see Ellipsoid
   */
  constructor(longitude: number = 0.0, latitude: number = 0.0, height: number = 0.0) {
    this.longitude = longitude;
    this.latitude = latitude;
    this.height = height;
  }

  // To avoid circular dependencies, these are set by Ellipsoid when Ellipsoid.default is set.
  static _ellipsoidOneOverRadii: Cartesian3 = new Cartesian3(
    1.0 / 6378137.0,
    1.0 / 6378137.0,
    1.0 / 6356752.3142451793
  );

  static _ellipsoidOneOverRadiiSquared: Cartesian3 = new Cartesian3(
    1.0 / (6378137.0 * 6378137.0),
    1.0 / (6378137.0 * 6378137.0),
    1.0 / (6356752.3142451793 * 6356752.3142451793)
  );

  static _ellipsoidCenterToleranceSquared: number = CesiumMath.EPSILON1;

  /**
   * An immutable Cartographic instance initialized to (0.0, 0.0, 0.0).
   */
  static ZERO: Readonly<Cartographic> = Object.freeze(new Cartographic(0.0, 0.0, 0.0));

  /**
   * Creates a new Cartographic instance from longitude and latitude
   * specified in radians.
   *
   * @param longitude - The longitude, in radians.
   * @param latitude - The latitude, in radians.
   * @param height - The height, in meters, above the ellipsoid. Default is 0.0.
   * @param result - The object onto which to store the result.
   * @returns The modified result parameter or a new Cartographic instance if one was not provided.
   */
  static fromRadians(
    longitude: number,
    latitude: number,
    height?: number,
    result?: Cartographic
  ): Cartographic {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.number("longitude", longitude);
    Check.typeOf.number("latitude", latitude);
    //>>includeEnd('debug');

    const resolvedHeight = height ?? 0.0;

    if (!defined(result)) {
      return new Cartographic(longitude, latitude, resolvedHeight);
    }

    result.longitude = longitude;
    result.latitude = latitude;
    result.height = resolvedHeight;
    return result;
  }

  /**
   * Creates a new Cartographic instance from longitude and latitude
   * specified in degrees. The values in the resulting object will
   * be in radians.
   *
   * @param longitude - The longitude, in degrees.
   * @param latitude - The latitude, in degrees.
   * @param height - The height, in meters, above the ellipsoid. Default is 0.0.
   * @param result - The object onto which to store the result.
   * @returns The modified result parameter or a new Cartographic instance if one was not provided.
   */
  static fromDegrees(
    longitude: number,
    latitude: number,
    height?: number,
    result?: Cartographic
  ): Cartographic {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.number("longitude", longitude);
    Check.typeOf.number("latitude", latitude);
    //>>includeEnd('debug');

    const longitudeRadians = CesiumMath.toRadians(longitude);
    const latitudeRadians = CesiumMath.toRadians(latitude);

    return Cartographic.fromRadians(longitudeRadians, latitudeRadians, height, result);
  }

  /**
   * Creates a new Cartographic instance from a Cartesian position. The values in the
   * resulting object will be in radians.
   *
   * @param cartesian - The Cartesian position to convert to cartographic representation.
   * @param ellipsoid - The ellipsoid on which the position lies. Default is Ellipsoid.default.
   * @param result - The object onto which to store the result.
   * @returns The modified result parameter, new Cartographic instance if none was provided, or undefined if the cartesian is at the center of the ellipsoid.
   */
  static fromCartesian(
    cartesian: Cartesian3,
    ellipsoid?: EllipsoidLike,
    result?: Cartographic
  ): Cartographic | undefined {
    const oneOverRadii = defined(ellipsoid)
      ? ellipsoid!.oneOverRadii
      : Cartographic._ellipsoidOneOverRadii;
    const oneOverRadiiSquared = defined(ellipsoid)
      ? ellipsoid!.oneOverRadiiSquared
      : Cartographic._ellipsoidOneOverRadiiSquared;
    const centerToleranceSquared = defined(ellipsoid)
      ? ellipsoid!._centerToleranceSquared
      : Cartographic._ellipsoidCenterToleranceSquared;

    // `cartesian is required.` is thrown from scaleToGeodeticSurface
    const p = scaleToGeodeticSurface(
      cartesian,
      oneOverRadii,
      oneOverRadiiSquared,
      centerToleranceSquared,
      cartesianToCartographicP
    );

    if (!defined(p)) {
      return undefined;
    }

    let n = Cartesian3.multiplyComponents(
      p,
      oneOverRadiiSquared,
      cartesianToCartographicN
    );
    n = Cartesian3.normalize(n, n);

    const h = Cartesian3.subtract(cartesian, p, cartesianToCartographicH);

    const longitude = Math.atan2(n.y, n.x);
    const latitude = Math.asin(n.z);
    const heightValue =
      CesiumMath.sign(Cartesian3.dot(h, cartesian)) * Cartesian3.magnitude(h);

    if (!defined(result)) {
      return new Cartographic(longitude, latitude, heightValue);
    }

    result.longitude = longitude;
    result.latitude = latitude;
    result.height = heightValue;
    return result;
  }

  /**
   * Creates a new Cartesian3 instance from a Cartographic input. The values in the inputted
   * object should be in radians.
   *
   * @param cartographic - Input to be converted into a Cartesian3 output.
   * @param ellipsoid - The ellipsoid on which the position lies. Default is Ellipsoid.default.
   * @param result - The object onto which to store the result.
   * @returns The position as a Cartesian3.
   */
  static toCartesian(
    cartographic: Cartographic,
    ellipsoid?: { radiiSquared: Cartesian3 },
    result?: Cartesian3
  ): Cartesian3 {
    //>>includeStart('debug', pragmas.debug);
    Check.defined("cartographic", cartographic);
    //>>includeEnd('debug');

    return Cartesian3.fromRadians(
      cartographic.longitude,
      cartographic.latitude,
      cartographic.height,
      ellipsoid,
      result
    );
  }

  /**
   * Duplicates a Cartographic instance.
   *
   * @param cartographic - The cartographic to duplicate.
   * @param result - The object onto which to store the result.
   * @returns The modified result parameter or a new Cartographic instance if one was not provided. Returns undefined if cartographic is undefined.
   */
  static clone(cartographic: Cartographic, result?: Cartographic): Cartographic;
  static clone(cartographic: undefined, result?: Cartographic): undefined;
  static clone(
    cartographic: Cartographic | undefined,
    result?: Cartographic
  ): Cartographic | undefined;
  static clone(
    cartographic: Cartographic | undefined,
    result?: Cartographic
  ): Cartographic | undefined {
    if (!defined(cartographic)) {
      return undefined;
    }

    if (!defined(result)) {
      return new Cartographic(
        cartographic.longitude,
        cartographic.latitude,
        cartographic.height
      );
    }

    result.longitude = cartographic.longitude;
    result.latitude = cartographic.latitude;
    result.height = cartographic.height;
    return result;
  }

  /**
   * Compares the provided cartographics componentwise and returns
   * true if they are equal, false otherwise.
   *
   * @param left - The first cartographic.
   * @param right - The second cartographic.
   * @returns true if left and right are equal, false otherwise.
   */
  static equals(left?: Cartographic, right?: Cartographic): boolean {
    return (
      left === right ||
      (defined(left) &&
        defined(right) &&
        left!.longitude === right!.longitude &&
        left!.latitude === right!.latitude &&
        left!.height === right!.height)
    );
  }

  /**
   * Compares the provided cartographics componentwise and returns
   * true if they are within the provided epsilon, false otherwise.
   *
   * @param left - The first cartographic.
   * @param right - The second cartographic.
   * @param epsilon - The epsilon to use for equality testing. Default is 0.
   * @returns true if left and right are within the provided epsilon, false otherwise.
   */
  static equalsEpsilon(
    left?: Cartographic,
    right?: Cartographic,
    epsilon: number = 0
  ): boolean {
    return (
      left === right ||
      (defined(left) &&
        defined(right) &&
        Math.abs(left!.longitude - right!.longitude) <= epsilon &&
        Math.abs(left!.latitude - right!.latitude) <= epsilon &&
        Math.abs(left!.height - right!.height) <= epsilon)
    );
  }

  /**
   * Duplicates this instance.
   *
   * @param result - The object onto which to store the result.
   * @returns The modified result parameter or a new Cartographic instance if one was not provided.
   */
  clone(result?: Cartographic): Cartographic {
    return Cartographic.clone(this, result) as Cartographic;
  }

  /**
   * Compares the provided against this cartographic componentwise and returns
   * true if they are equal, false otherwise.
   *
   * @param right - The second cartographic.
   * @returns true if left and right are equal, false otherwise.
   */
  equals(right?: Cartographic): boolean {
    return Cartographic.equals(this, right);
  }

  /**
   * Compares the provided against this cartographic componentwise and returns
   * true if they are within the provided epsilon, false otherwise.
   *
   * @param right - The second cartographic.
   * @param epsilon - The epsilon to use for equality testing. Default is 0.
   * @returns true if left and right are within the provided epsilon, false otherwise.
   */
  equalsEpsilon(right?: Cartographic, epsilon: number = 0): boolean {
    return Cartographic.equalsEpsilon(this, right, epsilon);
  }

  /**
   * Creates a string representing this cartographic in the format '(longitude, latitude, height)'.
   *
   * @returns A string representing the provided cartographic in the format '(longitude, latitude, height)'.
   */
  toString(): string {
    return `(${this.longitude}, ${this.latitude}, ${this.height})`;
  }
}

export default Cartographic;
