import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";

/**
 * Determines visibility based on the distance to the camera.
 *
 * @alias DistanceDisplayCondition
 *
 * @example
 * // Make a billboard that is only visible when the distance to the camera is between 10 and 20 meters.
 * billboard.distanceDisplayCondition = new Cesium.DistanceDisplayCondition(10.0, 20.0);
 */
class DistanceDisplayCondition {
  private _near: number;
  private _far: number;

  /**
   * The number of elements used to pack the object into an array.
   */
  static packedLength: number = 2;

  /**
   * Creates a new DistanceDisplayCondition.
   * @param near - The smallest distance in the interval where the object is visible. Default is 0.0.
   * @param far - The largest distance in the interval where the object is visible. Default is Number.MAX_VALUE.
   */
  constructor(near: number = 0.0, far: number = Number.MAX_VALUE) {
    this._near = near;
    this._far = far;
  }

  /**
   * The smallest distance in the interval where the object is visible.
   * @default 0.0
   */
  get near(): number {
    return this._near;
  }

  set near(value: number) {
    this._near = value;
  }

  /**
   * The largest distance in the interval where the object is visible.
   * @default Number.MAX_VALUE
   */
  get far(): number {
    return this._far;
  }

  set far(value: number) {
    this._far = value;
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
    value: DistanceDisplayCondition,
    array: number[],
    startingIndex: number = 0,
  ): number[] {
    //>>includeStart('debug', pragmas.debug);
    if (!defined(value)) {
      throw new DeveloperError("value is required");
    }
    if (!defined(array)) {
      throw new DeveloperError("array is required");
    }
    //>>includeEnd('debug');

    array[startingIndex++] = value.near;
    array[startingIndex] = value.far;

    return array;
  }

  /**
   * Retrieves an instance from a packed array.
   *
   * @param array - The packed array.
   * @param startingIndex - The starting index of the element to be unpacked.
   * @param result - The object into which to store the result.
   * @returns The modified result parameter or a new DistanceDisplayCondition instance if one was not provided.
   */
  static unpack(
    array: number[],
    startingIndex: number = 0,
    result?: DistanceDisplayCondition,
  ): DistanceDisplayCondition {
    //>>includeStart('debug', pragmas.debug);
    if (!defined(array)) {
      throw new DeveloperError("array is required");
    }
    //>>includeEnd('debug');

    if (!defined(result)) {
      result = new DistanceDisplayCondition();
    }
    result!.near = array[startingIndex++];
    result!.far = array[startingIndex];
    return result!;
  }

  /**
   * Determines if two distance display conditions are equal.
   *
   * @param left - A distance display condition.
   * @param right - Another distance display condition.
   * @returns Whether the two distance display conditions are equal.
   */
  static equals(
    left?: DistanceDisplayCondition,
    right?: DistanceDisplayCondition,
  ): boolean {
    return (
      left === right ||
      (defined(left) &&
        defined(right) &&
        left!.near === right!.near &&
        left!.far === right!.far)
    );
  }

  /**
   * Duplicates a distance display condition instance.
   *
   * @param value - The distance display condition to duplicate.
   * @param result - The result onto which to store the result.
   * @returns The duplicated instance.
   */
  static clone(
    value: DistanceDisplayCondition | undefined,
    result?: DistanceDisplayCondition,
  ): DistanceDisplayCondition | undefined {
    if (!defined(value)) {
      return undefined;
    }

    if (!defined(result)) {
      result = new DistanceDisplayCondition();
    }

    result!.near = value!.near;
    result!.far = value!.far;
    return result;
  }

  /**
   * Duplicates this instance.
   *
   * @param result - The result onto which to store the result.
   * @returns The duplicated instance.
   */
  clone(result?: DistanceDisplayCondition): DistanceDisplayCondition | undefined {
    return DistanceDisplayCondition.clone(this, result);
  }

  /**
   * Determines if this distance display condition is equal to another.
   *
   * @param other - Another distance display condition.
   * @returns Whether this distance display condition is equal to the other.
   */
  equals(other?: DistanceDisplayCondition): boolean {
    return DistanceDisplayCondition.equals(this, other);
  }
}

export default DistanceDisplayCondition;
