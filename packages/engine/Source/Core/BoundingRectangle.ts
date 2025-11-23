import Cartesian2 from "./Cartesian2.js";
import Cartographic from "./Cartographic.js";
import Check from "./Check.js";
import defined from "./defined.js";
import Ellipsoid from "./Ellipsoid.js";
import GeographicProjection from "./GeographicProjection.js";
import Intersect from "./Intersect.js";
import Rectangle from "./Rectangle.js";

const defaultProjection = new GeographicProjection();
const fromRectangleLowerLeft = new Cartographic();
const fromRectangleUpperRight = new Cartographic();

/**
 * A bounding rectangle given by a corner, width and height.
 * @alias BoundingRectangle
 *
 * @see BoundingSphere
 * @see Packable
 */
class BoundingRectangle {
  /**
   * The x coordinate of the rectangle.
   */
  x: number;

  /**
   * The y coordinate of the rectangle.
   */
  y: number;

  /**
   * The width of the rectangle.
   */
  width: number;

  /**
   * The height of the rectangle.
   */
  height: number;

  /**
   * The number of elements used to pack the object into an array.
   */
  static packedLength: number = 4;

  /**
   * Creates a new BoundingRectangle.
   * @param x - The x coordinate of the rectangle. Default is 0.0.
   * @param y - The y coordinate of the rectangle. Default is 0.0.
   * @param width - The width of the rectangle. Default is 0.0.
   * @param height - The height of the rectangle. Default is 0.0.
   */
  constructor(
    x: number = 0.0,
    y: number = 0.0,
    width: number = 0.0,
    height: number = 0.0,
  ) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  /**
   * Stores the provided instance into the provided array.
   *
   * @param value - The value to pack.
   * @param array - The array to pack into.
   * @param startingIndex - The index into the array at which to start packing the elements.
   * @returns The array that was packed into.
   */
  static pack(
    value: BoundingRectangle,
    array: number[],
    startingIndex: number = 0,
  ): number[] {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("value", value);
    Check.defined("array", array);
    //>>includeEnd('debug');

    array[startingIndex++] = value.x;
    array[startingIndex++] = value.y;
    array[startingIndex++] = value.width;
    array[startingIndex] = value.height;

    return array;
  }

  /**
   * Retrieves an instance from a packed array.
   *
   * @param array - The packed array.
   * @param startingIndex - The starting index of the element to be unpacked.
   * @param result - The object into which to store the result.
   * @returns The modified result parameter or a new BoundingRectangle instance if one was not provided.
   */
  static unpack(
    array: number[],
    startingIndex: number = 0,
    result?: BoundingRectangle,
  ): BoundingRectangle {
    //>>includeStart('debug', pragmas.debug);
    Check.defined("array", array);
    //>>includeEnd('debug');

    if (!defined(result)) {
      result = new BoundingRectangle();
    }
    result!.x = array[startingIndex++];
    result!.y = array[startingIndex++];
    result!.width = array[startingIndex++];
    result!.height = array[startingIndex];
    return result!;
  }

  /**
   * Computes a bounding rectangle enclosing the list of 2D points.
   * The rectangle is oriented with the corner at the bottom left.
   *
   * @param positions - List of points that the bounding rectangle will enclose. Each point must have x and y properties.
   * @param result - The object onto which to store the result.
   * @returns The modified result parameter or a new BoundingRectangle instance if one was not provided.
   */
  static fromPoints(
    positions?: Cartesian2[],
    result?: BoundingRectangle,
  ): BoundingRectangle {
    if (!defined(result)) {
      result = new BoundingRectangle();
    }

    if (!defined(positions) || positions!.length === 0) {
      result!.x = 0;
      result!.y = 0;
      result!.width = 0;
      result!.height = 0;
      return result!;
    }

    const length = positions!.length;

    let minimumX = positions![0].x;
    let minimumY = positions![0].y;

    let maximumX = positions![0].x;
    let maximumY = positions![0].y;

    for (let i = 1; i < length; i++) {
      const p = positions![i];
      const x = p.x;
      const y = p.y;

      minimumX = Math.min(x, minimumX);
      maximumX = Math.max(x, maximumX);
      minimumY = Math.min(y, minimumY);
      maximumY = Math.max(y, maximumY);
    }

    result!.x = minimumX;
    result!.y = minimumY;
    result!.width = maximumX - minimumX;
    result!.height = maximumY - minimumY;
    return result!;
  }

  /**
   * Computes a bounding rectangle from a rectangle.
   *
   * @param rectangle - The valid rectangle used to create a bounding rectangle.
   * @param projection - The projection used to project the rectangle into 2D.
   * @param result - The object onto which to store the result.
   * @returns The modified result parameter or a new BoundingRectangle instance if one was not provided.
   */
  static fromRectangle(
    rectangle?: Rectangle,
    projection?: GeographicProjection,
    result?: BoundingRectangle,
  ): BoundingRectangle {
    if (!defined(result)) {
      result = new BoundingRectangle();
    }

    if (!defined(rectangle)) {
      result!.x = 0;
      result!.y = 0;
      result!.width = 0;
      result!.height = 0;
      return result!;
    }

    defaultProjection._ellipsoid = Ellipsoid.default;
    projection = projection ?? defaultProjection;

    const lowerLeft = projection.project(
      Rectangle.southwest(rectangle!, fromRectangleLowerLeft),
    );
    const upperRight = projection.project(
      Rectangle.northeast(rectangle!, fromRectangleUpperRight),
    );

    Cartesian2.subtract(upperRight, lowerLeft, upperRight);

    result!.x = lowerLeft.x;
    result!.y = lowerLeft.y;
    result!.width = upperRight.x;
    result!.height = upperRight.y;
    return result!;
  }

  /**
   * Duplicates a BoundingRectangle instance.
   *
   * @param rectangle - The bounding rectangle to duplicate.
   * @param result - The object onto which to store the result.
   * @returns The modified result parameter or a new BoundingRectangle instance if one was not provided. (Returns undefined if rectangle is undefined)
   */
  static clone(
    rectangle: BoundingRectangle | undefined,
    result?: BoundingRectangle,
  ): BoundingRectangle | undefined {
    if (!defined(rectangle)) {
      return undefined;
    }

    if (!defined(result)) {
      return new BoundingRectangle(
        rectangle!.x,
        rectangle!.y,
        rectangle!.width,
        rectangle!.height,
      );
    }

    result!.x = rectangle!.x;
    result!.y = rectangle!.y;
    result!.width = rectangle!.width;
    result!.height = rectangle!.height;
    return result;
  }

  /**
   * Computes a bounding rectangle that is the union of the left and right bounding rectangles.
   *
   * @param left - A rectangle to enclose in bounding rectangle.
   * @param right - A rectangle to enclose in a bounding rectangle.
   * @param result - The object onto which to store the result.
   * @returns The modified result parameter or a new BoundingRectangle instance if one was not provided.
   */
  static union(
    left: BoundingRectangle,
    right: BoundingRectangle,
    result?: BoundingRectangle,
  ): BoundingRectangle {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("left", left);
    Check.typeOf.object("right", right);
    //>>includeEnd('debug');

    if (!defined(result)) {
      result = new BoundingRectangle();
    }

    const lowerLeftX = Math.min(left.x, right.x);
    const lowerLeftY = Math.min(left.y, right.y);
    const upperRightX = Math.max(left.x + left.width, right.x + right.width);
    const upperRightY = Math.max(left.y + left.height, right.y + right.height);

    result!.x = lowerLeftX;
    result!.y = lowerLeftY;
    result!.width = upperRightX - lowerLeftX;
    result!.height = upperRightY - lowerLeftY;
    return result!;
  }

  /**
   * Computes a bounding rectangle by enlarging the provided rectangle until it contains the provided point.
   *
   * @param rectangle - A rectangle to expand.
   * @param point - A point to enclose in a bounding rectangle.
   * @param result - The object onto which to store the result.
   * @returns The modified result parameter or a new BoundingRectangle instance if one was not provided.
   */
  static expand(
    rectangle: BoundingRectangle,
    point: Cartesian2,
    result?: BoundingRectangle,
  ): BoundingRectangle {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("rectangle", rectangle);
    Check.typeOf.object("point", point);
    //>>includeEnd('debug');

    result = BoundingRectangle.clone(rectangle, result)!;

    const width = point.x - result.x;
    const height = point.y - result.y;

    if (width > result.width) {
      result.width = width;
    } else if (width < 0) {
      result.width -= width;
      result.x = point.x;
    }

    if (height > result.height) {
      result.height = height;
    } else if (height < 0) {
      result.height -= height;
      result.y = point.y;
    }

    return result;
  }

  /**
   * Determines if two rectangles intersect.
   *
   * @param left - A rectangle to check for intersection.
   * @param right - The other rectangle to check for intersection.
   * @returns Intersect.INTERSECTING if the rectangles intersect, Intersect.OUTSIDE otherwise.
   */
  static intersect(left: BoundingRectangle, right: BoundingRectangle): number {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("left", left);
    Check.typeOf.object("right", right);
    //>>includeEnd('debug');

    const leftX = left.x;
    const leftY = left.y;
    const rightX = right.x;
    const rightY = right.y;
    if (
      !(
        leftX > rightX + right.width ||
        leftX + left.width < rightX ||
        leftY + left.height < rightY ||
        leftY > rightY + right.height
      )
    ) {
      return Intersect.INTERSECTING;
    }

    return Intersect.OUTSIDE;
  }

  /**
   * Compares the provided BoundingRectangles componentwise and returns
   * true if they are equal, false otherwise.
   *
   * @param left - The first BoundingRectangle.
   * @param right - The second BoundingRectangle.
   * @returns true if left and right are equal, false otherwise.
   */
  static equals(
    left?: BoundingRectangle,
    right?: BoundingRectangle,
  ): boolean {
    return (
      left === right ||
      (defined(left) &&
        defined(right) &&
        left!.x === right!.x &&
        left!.y === right!.y &&
        left!.width === right!.width &&
        left!.height === right!.height)
    );
  }

  /**
   * Duplicates this BoundingRectangle instance.
   *
   * @param result - The object onto which to store the result.
   * @returns The modified result parameter or a new BoundingRectangle instance if one was not provided.
   */
  clone(result?: BoundingRectangle): BoundingRectangle | undefined {
    return BoundingRectangle.clone(this, result);
  }

  /**
   * Determines if this rectangle intersects with another.
   *
   * @param right - A rectangle to check for intersection.
   * @returns Intersect.INTERSECTING if the rectangles intersect, Intersect.OUTSIDE otherwise.
   */
  intersect(right: BoundingRectangle): number {
    return BoundingRectangle.intersect(this, right);
  }

  /**
   * Compares this BoundingRectangle against the provided BoundingRectangle componentwise and returns
   * true if they are equal, false otherwise.
   *
   * @param right - The right hand side BoundingRectangle.
   * @returns true if they are equal, false otherwise.
   */
  equals(right?: BoundingRectangle): boolean {
    return BoundingRectangle.equals(this, right);
  }
}

export default BoundingRectangle;
