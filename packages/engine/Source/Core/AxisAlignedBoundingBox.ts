import Cartesian3 from "./Cartesian3.js";
import Check from "./Check.js";
import defined from "./defined.js";
import Intersect from "./Intersect.js";
import Plane from "./Plane.js";

let intersectScratch = new Cartesian3();

/**
 * Creates an instance of an AxisAlignedBoundingBox from the minimum and maximum points along the x, y, and z axes.
 * @alias AxisAlignedBoundingBox
 *
 * @see BoundingSphere
 * @see BoundingRectangle
 */
class AxisAlignedBoundingBox {
  /**
   * The minimum point defining the bounding box.
   */
  minimum: Cartesian3;

  /**
   * The maximum point defining the bounding box.
   */
  maximum: Cartesian3;

  /**
   * The center point of the bounding box.
   */
  center: Cartesian3;

  /**
   * Creates a new AxisAlignedBoundingBox.
   * @param minimum - The minimum point along the x, y, and z axes. Default is Cartesian3.ZERO.
   * @param maximum - The maximum point along the x, y, and z axes. Default is Cartesian3.ZERO.
   * @param center - The center of the box; automatically computed if not supplied.
   */
  constructor(minimum?: Cartesian3, maximum?: Cartesian3, center?: Cartesian3) {
    this.minimum = Cartesian3.clone(minimum ?? Cartesian3.ZERO)!;
    this.maximum = Cartesian3.clone(maximum ?? Cartesian3.ZERO)!;

    // If center was not defined, compute it.
    if (!defined(center)) {
      this.center = Cartesian3.midpoint(this.minimum, this.maximum, new Cartesian3());
    } else {
      this.center = Cartesian3.clone(center)!;
    }
  }

  /**
   * Creates an instance of an AxisAlignedBoundingBox from its corners.
   *
   * @param minimum - The minimum point along the x, y, and z axes.
   * @param maximum - The maximum point along the x, y, and z axes.
   * @param result - The object onto which to store the result.
   * @returns The modified result parameter or a new AxisAlignedBoundingBox instance if one was not provided.
   *
   * @example
   * // Compute an axis aligned bounding box from the two corners.
   * const box = Cesium.AxisAlignedBoundingBox.fromCorners(new Cesium.Cartesian3(-1, -1, -1), new Cesium.Cartesian3(1, 1, 1));
   */
  static fromCorners(
    minimum: Cartesian3,
    maximum: Cartesian3,
    result?: AxisAlignedBoundingBox,
  ): AxisAlignedBoundingBox {
    //>>includeStart('debug', pragmas.debug);
    Check.defined("minimum", minimum);
    Check.defined("maximum", maximum);
    //>>includeEnd('debug');

    if (!defined(result)) {
      result = new AxisAlignedBoundingBox();
    }

    result!.minimum = Cartesian3.clone(minimum, result!.minimum)!;
    result!.maximum = Cartesian3.clone(maximum, result!.maximum)!;
    result!.center = Cartesian3.midpoint(minimum, maximum, result!.center);

    return result!;
  }

  /**
   * Computes an instance of an AxisAlignedBoundingBox. The box is determined by
   * finding the points spaced the farthest apart on the x, y, and z axes.
   *
   * @param positions - List of points that the bounding box will enclose. Each point must have x, y, and z properties.
   * @param result - The object onto which to store the result.
   * @returns The modified result parameter or a new AxisAlignedBoundingBox instance if one was not provided.
   *
   * @example
   * // Compute an axis aligned bounding box enclosing two points.
   * const box = Cesium.AxisAlignedBoundingBox.fromPoints([new Cesium.Cartesian3(2, 0, 0), new Cesium.Cartesian3(-2, 0, 0)]);
   */
  static fromPoints(
    positions?: Cartesian3[],
    result?: AxisAlignedBoundingBox,
  ): AxisAlignedBoundingBox {
    if (!defined(result)) {
      result = new AxisAlignedBoundingBox();
    }

    if (!defined(positions) || positions!.length === 0) {
      result!.minimum = Cartesian3.clone(Cartesian3.ZERO, result!.minimum)!;
      result!.maximum = Cartesian3.clone(Cartesian3.ZERO, result!.maximum)!;
      result!.center = Cartesian3.clone(Cartesian3.ZERO, result!.center)!;
      return result!;
    }

    let minimumX = positions![0].x;
    let minimumY = positions![0].y;
    let minimumZ = positions![0].z;

    let maximumX = positions![0].x;
    let maximumY = positions![0].y;
    let maximumZ = positions![0].z;

    const length = positions!.length;
    for (let i = 1; i < length; i++) {
      const p = positions![i];
      const x = p.x;
      const y = p.y;
      const z = p.z;

      minimumX = Math.min(x, minimumX);
      maximumX = Math.max(x, maximumX);
      minimumY = Math.min(y, minimumY);
      maximumY = Math.max(y, maximumY);
      minimumZ = Math.min(z, minimumZ);
      maximumZ = Math.max(z, maximumZ);
    }

    const minimum = result!.minimum;
    minimum.x = minimumX;
    minimum.y = minimumY;
    minimum.z = minimumZ;

    const maximum = result!.maximum;
    maximum.x = maximumX;
    maximum.y = maximumY;
    maximum.z = maximumZ;

    result!.center = Cartesian3.midpoint(minimum, maximum, result!.center);

    return result!;
  }

  /**
   * Duplicates a AxisAlignedBoundingBox instance.
   *
   * @param box - The bounding box to duplicate.
   * @param result - The object onto which to store the result.
   * @returns The modified result parameter or a new AxisAlignedBoundingBox instance if none was provided. (Returns undefined if box is undefined)
   */
  static clone(
    box: AxisAlignedBoundingBox | undefined,
    result?: AxisAlignedBoundingBox,
  ): AxisAlignedBoundingBox | undefined {
    if (!defined(box)) {
      return undefined;
    }

    if (!defined(result)) {
      return new AxisAlignedBoundingBox(box!.minimum, box!.maximum, box!.center);
    }

    result!.minimum = Cartesian3.clone(box!.minimum, result!.minimum)!;
    result!.maximum = Cartesian3.clone(box!.maximum, result!.maximum)!;
    result!.center = Cartesian3.clone(box!.center, result!.center)!;
    return result;
  }

  /**
   * Compares the provided AxisAlignedBoundingBox componentwise and returns
   * true if they are equal, false otherwise.
   *
   * @param left - The first AxisAlignedBoundingBox.
   * @param right - The second AxisAlignedBoundingBox.
   * @returns true if left and right are equal, false otherwise.
   */
  static equals(
    left?: AxisAlignedBoundingBox,
    right?: AxisAlignedBoundingBox,
  ): boolean {
    return (
      left === right ||
      (defined(left) &&
        defined(right) &&
        Cartesian3.equals(left!.center, right!.center) &&
        Cartesian3.equals(left!.minimum, right!.minimum) &&
        Cartesian3.equals(left!.maximum, right!.maximum))
    );
  }

  /**
   * Determines which side of a plane a box is located.
   *
   * @param box - The bounding box to test.
   * @param plane - The plane to test against.
   * @returns Intersect.INSIDE if the entire box is on the side of the plane
   *          the normal is pointing, Intersect.OUTSIDE if the entire box is
   *          on the opposite side, and Intersect.INTERSECTING if the box
   *          intersects the plane.
   */
  static intersectPlane(box: AxisAlignedBoundingBox, plane: Plane): number {
    //>>includeStart('debug', pragmas.debug);
    Check.defined("box", box);
    Check.defined("plane", plane);
    //>>includeEnd('debug');

    intersectScratch = Cartesian3.subtract(
      box.maximum,
      box.minimum,
      intersectScratch,
    );
    const h = Cartesian3.multiplyByScalar(
      intersectScratch,
      0.5,
      intersectScratch,
    ); //The positive half diagonal
    const normal = plane.normal;
    const e =
      h.x * Math.abs(normal.x) +
      h.y * Math.abs(normal.y) +
      h.z * Math.abs(normal.z);
    const s = Cartesian3.dot(box.center, normal) + plane.distance; //signed distance from center

    if (s - e > 0) {
      return Intersect.INSIDE;
    }

    if (s + e < 0) {
      //Not in front because normals point inward
      return Intersect.OUTSIDE;
    }

    return Intersect.INTERSECTING;
  }

  /**
   * Determines whether two axis aligned bounding boxes intersect.
   *
   * @param box - first box
   * @param other - second box
   * @returns true if the boxes intersect; otherwise, false.
   */
  static intersectAxisAlignedBoundingBox(
    box: AxisAlignedBoundingBox,
    other: AxisAlignedBoundingBox,
  ): boolean {
    //>>includeStart('debug', pragmas.debug);
    Check.defined("box", box);
    Check.defined("other", other);
    //>>includeEnd('debug');

    // This short circuits in favor of AABBs that do not intersect.
    return (
      box.minimum.x <= other.maximum.x &&
      box.maximum.x >= other.minimum.x &&
      box.minimum.y <= other.maximum.y &&
      box.maximum.y >= other.minimum.y &&
      box.minimum.z <= other.maximum.z &&
      box.maximum.z >= other.minimum.z
    );
  }

  /**
   * Duplicates this AxisAlignedBoundingBox instance.
   *
   * @param result - The object onto which to store the result.
   * @returns The modified result parameter or a new AxisAlignedBoundingBox instance if one was not provided.
   */
  clone(result?: AxisAlignedBoundingBox): AxisAlignedBoundingBox | undefined {
    return AxisAlignedBoundingBox.clone(this, result);
  }

  /**
   * Determines which side of a plane this box is located.
   *
   * @param plane - The plane to test against.
   * @returns Intersect.INSIDE if the entire box is on the side of the plane
   *          the normal is pointing, Intersect.OUTSIDE if the entire box is
   *          on the opposite side, and Intersect.INTERSECTING if the box
   *          intersects the plane.
   */
  intersectPlane(plane: Plane): number {
    return AxisAlignedBoundingBox.intersectPlane(this, plane);
  }

  /**
   * Determines whether some other axis aligned bounding box intersects this box.
   *
   * @param other - The other axis aligned bounding box.
   * @returns true if the boxes intersect; otherwise, false.
   */
  intersectAxisAlignedBoundingBox(other: AxisAlignedBoundingBox): boolean {
    return AxisAlignedBoundingBox.intersectAxisAlignedBoundingBox(this, other);
  }

  /**
   * Compares this AxisAlignedBoundingBox against the provided AxisAlignedBoundingBox componentwise and returns
   * true if they are equal, false otherwise.
   *
   * @param right - The right hand side AxisAlignedBoundingBox.
   * @returns true if they are equal, false otherwise.
   */
  equals(right?: AxisAlignedBoundingBox): boolean {
    return AxisAlignedBoundingBox.equals(this, right);
  }
}

export default AxisAlignedBoundingBox;
