import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";
import CesiumMath from "./Math.js";

/**
 * Interface for Quaternion-like objects used in HeadingPitchRoll operations.
 * This avoids circular dependencies with the Quaternion class.
 */
interface QuaternionLike {
  x: number;
  y: number;
  z: number;
  w: number;
}

/**
 * A rotation expressed as a heading, pitch, and roll. Heading is the rotation about the
 * negative z axis. Pitch is the rotation about the negative y axis. Roll is the rotation about
 * the positive x axis.
 */
class HeadingPitchRoll {
  /**
   * The heading component in radians.
   */
  heading: number;

  /**
   * The pitch component in radians.
   */
  pitch: number;

  /**
   * The roll component in radians.
   */
  roll: number;

  /**
   * Creates a new HeadingPitchRoll instance.
   *
   * @param heading - The heading component in radians. Default is 0.0.
   * @param pitch - The pitch component in radians. Default is 0.0.
   * @param roll - The roll component in radians. Default is 0.0.
   */
  constructor(heading: number = 0.0, pitch: number = 0.0, roll: number = 0.0) {
    this.heading = heading;
    this.pitch = pitch;
    this.roll = roll;
  }

  /**
   * Computes the heading, pitch and roll from a quaternion (see http://en.wikipedia.org/wiki/Conversion_between_quaternions_and_Euler_angles )
   *
   * @param quaternion - The quaternion from which to retrieve heading, pitch, and roll, all expressed in radians.
   * @param result - The object in which to store the result. If not provided, a new instance is created and returned.
   * @returns The modified result parameter or a new HeadingPitchRoll instance if one was not provided.
   */
  static fromQuaternion(
    quaternion: QuaternionLike,
    result?: HeadingPitchRoll
  ): HeadingPitchRoll {
    //>>includeStart('debug', pragmas.debug);
    if (!defined(quaternion)) {
      throw new DeveloperError("quaternion is required");
    }
    //>>includeEnd('debug');

    if (!defined(result)) {
      result = new HeadingPitchRoll();
    }

    const test = 2 * (quaternion.w * quaternion.y - quaternion.z * quaternion.x);
    const denominatorRoll =
      1 - 2 * (quaternion.x * quaternion.x + quaternion.y * quaternion.y);
    const numeratorRoll =
      2 * (quaternion.w * quaternion.x + quaternion.y * quaternion.z);
    const denominatorHeading =
      1 - 2 * (quaternion.y * quaternion.y + quaternion.z * quaternion.z);
    const numeratorHeading =
      2 * (quaternion.w * quaternion.z + quaternion.x * quaternion.y);

    result!.heading = -Math.atan2(numeratorHeading, denominatorHeading);
    result!.roll = Math.atan2(numeratorRoll, denominatorRoll);
    result!.pitch = -CesiumMath.asinClamped(test);

    return result!;
  }

  /**
   * Returns a new HeadingPitchRoll instance from angles given in degrees.
   *
   * @param heading - The heading in degrees.
   * @param pitch - The pitch in degrees.
   * @param roll - The roll in degrees.
   * @param result - The object in which to store the result. If not provided, a new instance is created and returned.
   * @returns A new HeadingPitchRoll instance.
   */
  static fromDegrees(
    heading: number,
    pitch: number,
    roll: number,
    result?: HeadingPitchRoll
  ): HeadingPitchRoll {
    //>>includeStart('debug', pragmas.debug);
    if (!defined(heading)) {
      throw new DeveloperError("heading is required");
    }
    if (!defined(pitch)) {
      throw new DeveloperError("pitch is required");
    }
    if (!defined(roll)) {
      throw new DeveloperError("roll is required");
    }
    //>>includeEnd('debug');

    if (!defined(result)) {
      result = new HeadingPitchRoll();
    }

    result!.heading = heading * CesiumMath.RADIANS_PER_DEGREE;
    result!.pitch = pitch * CesiumMath.RADIANS_PER_DEGREE;
    result!.roll = roll * CesiumMath.RADIANS_PER_DEGREE;

    return result!;
  }

  /**
   * Duplicates a HeadingPitchRoll instance.
   *
   * @param headingPitchRoll - The HeadingPitchRoll to duplicate.
   * @param result - The object onto which to store the result.
   * @returns The modified result parameter or a new HeadingPitchRoll instance if one was not provided.
   *          Returns undefined if headingPitchRoll is undefined.
   */
  static clone(
    headingPitchRoll: HeadingPitchRoll,
    result?: HeadingPitchRoll
  ): HeadingPitchRoll;
  static clone(
    headingPitchRoll: undefined,
    result?: HeadingPitchRoll
  ): undefined;
  static clone(
    headingPitchRoll: HeadingPitchRoll | undefined,
    result?: HeadingPitchRoll
  ): HeadingPitchRoll | undefined;
  static clone(
    headingPitchRoll: HeadingPitchRoll | undefined,
    result?: HeadingPitchRoll
  ): HeadingPitchRoll | undefined {
    if (!defined(headingPitchRoll)) {
      return undefined;
    }

    if (!defined(result)) {
      return new HeadingPitchRoll(
        headingPitchRoll.heading,
        headingPitchRoll.pitch,
        headingPitchRoll.roll
      );
    }

    result.heading = headingPitchRoll.heading;
    result.pitch = headingPitchRoll.pitch;
    result.roll = headingPitchRoll.roll;

    return result;
  }

  /**
   * Compares the provided HeadingPitchRolls componentwise and returns
   * true if they are equal, false otherwise.
   *
   * @param left - The first HeadingPitchRoll.
   * @param right - The second HeadingPitchRoll.
   * @returns true if left and right are equal, false otherwise.
   */
  static equals(
    left: HeadingPitchRoll | undefined,
    right: HeadingPitchRoll | undefined
  ): boolean {
    return (
      left === right ||
      (defined(left) &&
        defined(right) &&
        left.heading === right.heading &&
        left.pitch === right.pitch &&
        left.roll === right.roll)
    );
  }

  /**
   * Compares the provided HeadingPitchRolls componentwise and returns
   * true if they pass an absolute or relative tolerance test,
   * false otherwise.
   *
   * @param left - The first HeadingPitchRoll.
   * @param right - The second HeadingPitchRoll.
   * @param relativeEpsilon - The relative epsilon tolerance to use for equality testing. Default is 0.
   * @param absoluteEpsilon - The absolute epsilon tolerance to use for equality testing. Default is relativeEpsilon.
   * @returns true if left and right are within the provided epsilon, false otherwise.
   */
  static equalsEpsilon(
    left: HeadingPitchRoll | undefined,
    right: HeadingPitchRoll | undefined,
    relativeEpsilon: number = 0,
    absoluteEpsilon: number = relativeEpsilon
  ): boolean {
    return (
      left === right ||
      (defined(left) &&
        defined(right) &&
        CesiumMath.equalsEpsilon(
          left.heading,
          right.heading,
          relativeEpsilon,
          absoluteEpsilon
        ) &&
        CesiumMath.equalsEpsilon(
          left.pitch,
          right.pitch,
          relativeEpsilon,
          absoluteEpsilon
        ) &&
        CesiumMath.equalsEpsilon(
          left.roll,
          right.roll,
          relativeEpsilon,
          absoluteEpsilon
        ))
    );
  }

  /**
   * Duplicates this HeadingPitchRoll instance.
   *
   * @param result - The object onto which to store the result.
   * @returns The modified result parameter or a new HeadingPitchRoll instance if one was not provided.
   */
  clone(result?: HeadingPitchRoll): HeadingPitchRoll {
    return HeadingPitchRoll.clone(this, result)!;
  }

  /**
   * Compares this HeadingPitchRoll against the provided HeadingPitchRoll componentwise and returns
   * true if they are equal, false otherwise.
   *
   * @param right - The right hand side HeadingPitchRoll.
   * @returns true if they are equal, false otherwise.
   */
  equals(right?: HeadingPitchRoll): boolean {
    return HeadingPitchRoll.equals(this, right);
  }

  /**
   * Compares this HeadingPitchRoll against the provided HeadingPitchRoll componentwise and returns
   * true if they pass an absolute or relative tolerance test,
   * false otherwise.
   *
   * @param right - The right hand side HeadingPitchRoll.
   * @param relativeEpsilon - The relative epsilon tolerance to use for equality testing. Default is 0.
   * @param absoluteEpsilon - The absolute epsilon tolerance to use for equality testing. Default is relativeEpsilon.
   * @returns true if they are within the provided epsilon, false otherwise.
   */
  equalsEpsilon(
    right: HeadingPitchRoll | undefined,
    relativeEpsilon: number = 0,
    absoluteEpsilon: number = relativeEpsilon
  ): boolean {
    return HeadingPitchRoll.equalsEpsilon(
      this,
      right,
      relativeEpsilon,
      absoluteEpsilon
    );
  }

  /**
   * Creates a string representing this HeadingPitchRoll in the format '(heading, pitch, roll)' in radians.
   *
   * @returns A string representing the provided HeadingPitchRoll in the format '(heading, pitch, roll)'.
   */
  toString(): string {
    return `(${this.heading}, ${this.pitch}, ${this.roll})`;
  }
}

export default HeadingPitchRoll;
