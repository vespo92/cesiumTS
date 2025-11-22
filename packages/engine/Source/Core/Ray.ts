import Cartesian3 from "./Cartesian3.js";
import Check from "./Check.js";
import defined from "./defined.js";

/**
 * Represents a ray that extends infinitely from the provided origin in the provided direction.
 * @alias Ray
 */
class Ray {
  /**
   * The origin of the ray.
   * @default {@link Cartesian3.ZERO}
   */
  origin: Cartesian3;

  /**
   * The direction of the ray (normalized).
   */
  direction: Cartesian3;

  /**
   * Creates a new Ray instance.
   * @param origin - The origin of the ray. Default is Cartesian3.ZERO.
   * @param direction - The direction of the ray (will be normalized). Default is Cartesian3.ZERO.
   */
  constructor(origin?: Cartesian3, direction?: Cartesian3) {
    let normalizedDirection = Cartesian3.clone(direction ?? Cartesian3.ZERO) as Cartesian3;
    if (!Cartesian3.equals(normalizedDirection, Cartesian3.ZERO)) {
      Cartesian3.normalize(normalizedDirection, normalizedDirection);
    }

    this.origin = Cartesian3.clone(origin ?? Cartesian3.ZERO) as Cartesian3;
    this.direction = normalizedDirection;
  }

  /**
   * Duplicates a Ray instance.
   *
   * @param ray - The ray to duplicate.
   * @param result - The object onto which to store the result.
   * @returns The modified result parameter or a new Ray instance if one was not provided.
   *          Returns undefined if ray is undefined.
   */
  static clone(ray: Ray, result?: Ray): Ray;
  static clone(ray: undefined, result?: Ray): undefined;
  static clone(ray: Ray | undefined, result?: Ray): Ray | undefined;
  static clone(ray: Ray | undefined, result?: Ray): Ray | undefined {
    if (!defined(ray)) {
      return undefined;
    }
    if (!defined(result)) {
      return new Ray(ray.origin, ray.direction);
    }
    result.origin = Cartesian3.clone(ray.origin) as Cartesian3;
    result.direction = Cartesian3.clone(ray.direction) as Cartesian3;
    return result;
  }

  /**
   * Computes the point along the ray given by r(t) = o + t*d,
   * where o is the origin of the ray and d is the direction.
   *
   * @param ray - The ray.
   * @param t - A scalar value.
   * @param result - The object in which the result will be stored.
   * @returns The modified result parameter, or a new instance if none was provided.
   *
   * @example
   * // Get the first intersection point of a ray and an ellipsoid.
   * const intersection = Cesium.IntersectionTests.rayEllipsoid(ray, ellipsoid);
   * const point = Cesium.Ray.getPoint(ray, intersection.start);
   */
  static getPoint(ray: Ray, t: number, result?: Cartesian3): Cartesian3 {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("ray", ray);
    Check.typeOf.number("t", t);
    //>>includeEnd('debug');

    if (!defined(result)) {
      result = new Cartesian3();
    }

    result = Cartesian3.multiplyByScalar(ray.direction, t, result);
    return Cartesian3.add(ray.origin, result, result);
  }
}

export default Ray;
