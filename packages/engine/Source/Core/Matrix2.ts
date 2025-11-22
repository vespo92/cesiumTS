import Cartesian2 from "./Cartesian2.js";
import Check from "./Check.js";
import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";

/**
 * Matrix2-like interface for functions that accept matrix-like objects
 */
export interface Matrix2Like {
  readonly [index: number]: number;
  readonly length?: number;
}

/**
 * A 2x2 matrix, indexable as a column-major order array.
 * Constructor parameters are in row-major order for code readability.
 * @alias Matrix2
 *
 * @see Matrix2.fromArray
 * @see Matrix2.fromColumnMajorArray
 * @see Matrix2.fromRowMajorArray
 * @see Matrix2.fromScale
 * @see Matrix2.fromUniformScale
 * @see Matrix2.fromRotation
 * @see Matrix3
 * @see Matrix4
 */
class Matrix2 {
  /**
   * Index signature for array-like access to matrix elements
   */
  [index: number]: number;

  /**
   * The number of elements used to pack the object into an array.
   */
  static readonly packedLength: number = 4;

  /**
   * An immutable Matrix2 instance initialized to the identity matrix.
   */
  static readonly IDENTITY: Readonly<Matrix2> = Object.freeze(
    new Matrix2(1.0, 0.0, 0.0, 1.0)
  );

  /**
   * An immutable Matrix2 instance initialized to the zero matrix.
   */
  static readonly ZERO: Readonly<Matrix2> = Object.freeze(
    new Matrix2(0.0, 0.0, 0.0, 0.0)
  );

  /**
   * The index into Matrix2 for column 0, row 0.
   *
   * @example
   * const matrix = new Cesium.Matrix2();
   * matrix[Cesium.Matrix2.COLUMN0ROW0] = 5.0; // set column 0, row 0 to 5.0
   */
  static readonly COLUMN0ROW0: number = 0;

  /**
   * The index into Matrix2 for column 0, row 1.
   *
   * @example
   * const matrix = new Cesium.Matrix2();
   * matrix[Cesium.Matrix2.COLUMN0ROW1] = 5.0; // set column 0, row 1 to 5.0
   */
  static readonly COLUMN0ROW1: number = 1;

  /**
   * The index into Matrix2 for column 1, row 0.
   *
   * @example
   * const matrix = new Cesium.Matrix2();
   * matrix[Cesium.Matrix2.COLUMN1ROW0] = 5.0; // set column 1, row 0 to 5.0
   */
  static readonly COLUMN1ROW0: number = 2;

  /**
   * The index into Matrix2 for column 1, row 1.
   *
   * @example
   * const matrix = new Cesium.Matrix2();
   * matrix[Cesium.Matrix2.COLUMN1ROW1] = 5.0; // set column 1, row 1 to 5.0
   */
  static readonly COLUMN1ROW1: number = 3;

  /**
   * Creates a new Matrix2 instance.
   * @param column0Row0 - The value for column 0, row 0. Default is 0.0.
   * @param column1Row0 - The value for column 1, row 0. Default is 0.0.
   * @param column0Row1 - The value for column 0, row 1. Default is 0.0.
   * @param column1Row1 - The value for column 1, row 1. Default is 0.0.
   */
  constructor(
    column0Row0: number = 0.0,
    column1Row0: number = 0.0,
    column0Row1: number = 0.0,
    column1Row1: number = 0.0
  ) {
    this[0] = column0Row0;
    this[1] = column0Row1;
    this[2] = column1Row0;
    this[3] = column1Row1;
  }

  /**
   * Gets the number of items in the collection.
   */
  get length(): number {
    return Matrix2.packedLength;
  }

  /**
   * Stores the provided instance into the provided array.
   *
   * @param value - The value to pack.
   * @param array - The array to pack into.
   * @param startingIndex - The index into the array at which to start packing the elements. Default is 0.
   * @returns The array that was packed into.
   */
  static pack(
    value: Matrix2,
    array: number[],
    startingIndex: number = 0
  ): number[] {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("value", value);
    Check.defined("array", array);
    //>>includeEnd('debug');

    array[startingIndex++] = value[0];
    array[startingIndex++] = value[1];
    array[startingIndex++] = value[2];
    array[startingIndex++] = value[3];

    return array;
  }

  /**
   * Retrieves an instance from a packed array.
   *
   * @param array - The packed array.
   * @param startingIndex - The starting index of the element to be unpacked. Default is 0.
   * @param result - The object into which to store the result.
   * @returns The modified result parameter or a new Matrix2 instance if one was not provided.
   */
  static unpack(
    array: number[],
    startingIndex: number = 0,
    result?: Matrix2
  ): Matrix2 {
    //>>includeStart('debug', pragmas.debug);
    Check.defined("array", array);
    //>>includeEnd('debug');

    if (!defined(result)) {
      result = new Matrix2();
    }

    result![0] = array[startingIndex++];
    result![1] = array[startingIndex++];
    result![2] = array[startingIndex++];
    result![3] = array[startingIndex++];
    return result!;
  }

  /**
   * Creates a Matrix2 from 4 consecutive elements in an array.
   *
   * @param array - The array whose 4 consecutive elements correspond to the positions of the matrix. Assumes column-major order.
   * @param startingIndex - The offset into the array of the first element, which corresponds to first column first row position in the matrix. Default is 0.
   * @param result - The object onto which to store the result.
   * @returns The modified result parameter or a new Matrix2 instance if one was not provided.
   *
   * @example
   * // Create the Matrix2:
   * // [1.0, 2.0]
   * // [1.0, 2.0]
   *
   * const v = [1.0, 1.0, 2.0, 2.0];
   * const m = Cesium.Matrix2.fromArray(v);
   *
   * // Create same Matrix2 with using an offset into an array
   * const v2 = [0.0, 0.0, 1.0, 1.0, 2.0, 2.0];
   * const m2 = Cesium.Matrix2.fromArray(v2, 2);
   */
  static fromArray(
    array: number[],
    startingIndex?: number,
    result?: Matrix2
  ): Matrix2 {
    return Matrix2.unpack(array, startingIndex, result);
  }

  /**
   * Flattens an array of Matrix2s into an array of components. The components
   * are stored in column-major order.
   *
   * @param array - The array of matrices to pack.
   * @param result - The array onto which to store the result. If this is a typed array, it must have array.length * 4 components, else a {@link DeveloperError} will be thrown. If it is a regular array, it will be resized to have (array.length * 4) elements.
   * @returns The packed array.
   */
  static packArray(array: Matrix2[], result?: number[]): number[] {
    //>>includeStart('debug', pragmas.debug);
    Check.defined("array", array);
    //>>includeEnd('debug');

    const length = array.length;
    const resultLength = length * 4;
    if (!defined(result)) {
      result = new Array(resultLength);
    } else if (!Array.isArray(result) && result!.length !== resultLength) {
      //>>includeStart('debug', pragmas.debug);
      throw new DeveloperError(
        "If result is a typed array, it must have exactly array.length * 4 elements"
      );
      //>>includeEnd('debug');
    } else if (result!.length !== resultLength) {
      result!.length = resultLength;
    }

    for (let i = 0; i < length; ++i) {
      Matrix2.pack(array[i], result!, i * 4);
    }
    return result!;
  }

  /**
   * Unpacks an array of column-major matrix components into an array of Matrix2s.
   *
   * @param array - The array of components to unpack.
   * @param result - The array onto which to store the result.
   * @returns The unpacked array.
   */
  static unpackArray(array: number[], result?: Matrix2[]): Matrix2[] {
    //>>includeStart('debug', pragmas.debug);
    Check.defined("array", array);
    Check.typeOf.number.greaterThanOrEquals("array.length", array.length, 4);
    if (array.length % 4 !== 0) {
      throw new DeveloperError("array length must be a multiple of 4.");
    }
    //>>includeEnd('debug');

    const length = array.length;
    if (!defined(result)) {
      result = new Array(length / 4);
    } else {
      result!.length = length / 4;
    }

    for (let i = 0; i < length; i += 4) {
      const index = i / 4;
      result![index] = Matrix2.unpack(array, i, result![index]);
    }
    return result!;
  }

  /**
   * Duplicates a Matrix2 instance.
   *
   * @param matrix - The matrix to duplicate.
   * @param result - The object onto which to store the result.
   * @returns The modified result parameter or a new Matrix2 instance if one was not provided. (Returns undefined if matrix is undefined)
   */
  static clone(matrix: Matrix2Like, result?: Matrix2): Matrix2;
  static clone(
    matrix: Matrix2Like | undefined,
    result?: Matrix2
  ): Matrix2 | undefined;
  static clone(
    matrix: Matrix2Like | undefined,
    result?: Matrix2
  ): Matrix2 | undefined {
    if (!defined(matrix)) {
      return undefined;
    }
    if (!defined(result)) {
      return new Matrix2(matrix![0], matrix![2], matrix![1], matrix![3]);
    }
    result![0] = matrix![0];
    result![1] = matrix![1];
    result![2] = matrix![2];
    result![3] = matrix![3];
    return result;
  }

  /**
   * Creates a Matrix2 instance from a column-major order array.
   *
   * @param values - The column-major order array.
   * @param result - The object in which the result will be stored, if undefined a new instance will be created.
   * @returns The modified result parameter, or a new Matrix2 instance if one was not provided.
   */
  static fromColumnMajorArray(values: number[], result?: Matrix2): Matrix2 {
    //>>includeStart('debug', pragmas.debug);
    Check.defined("values", values);
    //>>includeEnd('debug');

    return Matrix2.clone(values, result)!;
  }

  /**
   * Creates a Matrix2 instance from a row-major order array.
   * The resulting matrix will be in column-major order.
   *
   * @param values - The row-major order array.
   * @param result - The object in which the result will be stored, if undefined a new instance will be created.
   * @returns The modified result parameter, or a new Matrix2 instance if one was not provided.
   */
  static fromRowMajorArray(values: number[], result?: Matrix2): Matrix2 {
    //>>includeStart('debug', pragmas.debug);
    Check.defined("values", values);
    //>>includeEnd('debug');

    if (!defined(result)) {
      return new Matrix2(values[0], values[1], values[2], values[3]);
    }
    result![0] = values[0];
    result![1] = values[2];
    result![2] = values[1];
    result![3] = values[3];
    return result!;
  }

  /**
   * Computes a Matrix2 instance representing a non-uniform scale.
   *
   * @param scale - The x and y scale factors.
   * @param result - The object in which the result will be stored, if undefined a new instance will be created.
   * @returns The modified result parameter, or a new Matrix2 instance if one was not provided.
   *
   * @example
   * // Creates
   * //   [7.0, 0.0]
   * //   [0.0, 8.0]
   * const m = Cesium.Matrix2.fromScale(new Cesium.Cartesian2(7.0, 8.0));
   */
  static fromScale(scale: Cartesian2, result?: Matrix2): Matrix2 {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("scale", scale);
    //>>includeEnd('debug');

    if (!defined(result)) {
      return new Matrix2(scale.x, 0.0, 0.0, scale.y);
    }

    result![0] = scale.x;
    result![1] = 0.0;
    result![2] = 0.0;
    result![3] = scale.y;
    return result!;
  }

  /**
   * Computes a Matrix2 instance representing a uniform scale.
   *
   * @param scale - The uniform scale factor.
   * @param result - The object in which the result will be stored, if undefined a new instance will be created.
   * @returns The modified result parameter, or a new Matrix2 instance if one was not provided.
   *
   * @example
   * // Creates
   * //   [2.0, 0.0]
   * //   [0.0, 2.0]
   * const m = Cesium.Matrix2.fromUniformScale(2.0);
   */
  static fromUniformScale(scale: number, result?: Matrix2): Matrix2 {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.number("scale", scale);
    //>>includeEnd('debug');

    if (!defined(result)) {
      return new Matrix2(scale, 0.0, 0.0, scale);
    }

    result![0] = scale;
    result![1] = 0.0;
    result![2] = 0.0;
    result![3] = scale;
    return result!;
  }

  /**
   * Creates a rotation matrix.
   *
   * @param angle - The angle, in radians, of the rotation. Positive angles are counterclockwise.
   * @param result - The object in which the result will be stored, if undefined a new instance will be created.
   * @returns The modified result parameter, or a new Matrix2 instance if one was not provided.
   *
   * @example
   * // Rotate a point 45 degrees counterclockwise.
   * const p = new Cesium.Cartesian2(5, 6);
   * const m = Cesium.Matrix2.fromRotation(Cesium.Math.toRadians(45.0));
   * const rotated = Cesium.Matrix2.multiplyByVector(m, p, new Cesium.Cartesian2());
   */
  static fromRotation(angle: number, result?: Matrix2): Matrix2 {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.number("angle", angle);
    //>>includeEnd('debug');

    const cosAngle = Math.cos(angle);
    const sinAngle = Math.sin(angle);

    if (!defined(result)) {
      return new Matrix2(cosAngle, -sinAngle, sinAngle, cosAngle);
    }
    result![0] = cosAngle;
    result![1] = sinAngle;
    result![2] = -sinAngle;
    result![3] = cosAngle;
    return result!;
  }

  /**
   * Creates an Array from the provided Matrix2 instance.
   * The array will be in column-major order.
   *
   * @param matrix - The matrix to use.
   * @param result - The Array onto which to store the result.
   * @returns The modified Array parameter or a new Array instance if one was not provided.
   */
  static toArray(matrix: Matrix2, result?: number[]): number[] {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("matrix", matrix);
    //>>includeEnd('debug');

    if (!defined(result)) {
      return [matrix[0], matrix[1], matrix[2], matrix[3]];
    }
    result![0] = matrix[0];
    result![1] = matrix[1];
    result![2] = matrix[2];
    result![3] = matrix[3];
    return result!;
  }

  /**
   * Computes the array index of the element at the provided row and column.
   *
   * @param column - The zero-based index of the column.
   * @param row - The zero-based index of the row.
   * @returns The index of the element at the provided row and column.
   *
   * @exception {DeveloperError} row must be 0 or 1.
   * @exception {DeveloperError} column must be 0 or 1.
   *
   * @example
   * const myMatrix = new Cesium.Matrix2();
   * const column1Row0Index = Cesium.Matrix2.getElementIndex(1, 0);
   * const column1Row0 = myMatrix[column1Row0Index]
   * myMatrix[column1Row0Index] = 10.0;
   */
  static getElementIndex(column: number, row: number): number {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.number.greaterThanOrEquals("row", row, 0);
    Check.typeOf.number.lessThanOrEquals("row", row, 1);

    Check.typeOf.number.greaterThanOrEquals("column", column, 0);
    Check.typeOf.number.lessThanOrEquals("column", column, 1);
    //>>includeEnd('debug');

    return column * 2 + row;
  }

  /**
   * Retrieves a copy of the matrix column at the provided index as a Cartesian2 instance.
   *
   * @param matrix - The matrix to use.
   * @param index - The zero-based index of the column to retrieve.
   * @param result - The object onto which to store the result.
   * @returns The modified result parameter.
   *
   * @exception {DeveloperError} index must be 0 or 1.
   */
  static getColumn(matrix: Matrix2, index: number, result: Cartesian2): Cartesian2 {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("matrix", matrix);

    Check.typeOf.number.greaterThanOrEquals("index", index, 0);
    Check.typeOf.number.lessThanOrEquals("index", index, 1);

    Check.typeOf.object("result", result);
    //>>includeEnd('debug');

    const startIndex = index * 2;
    const x = matrix[startIndex];
    const y = matrix[startIndex + 1];

    result.x = x;
    result.y = y;
    return result;
  }

  /**
   * Computes a new matrix that replaces the specified column in the provided matrix with the provided Cartesian2 instance.
   *
   * @param matrix - The matrix to use.
   * @param index - The zero-based index of the column to set.
   * @param cartesian - The Cartesian whose values will be assigned to the specified column.
   * @param result - The object onto which to store the result.
   * @returns The modified result parameter.
   *
   * @exception {DeveloperError} index must be 0 or 1.
   */
  static setColumn(
    matrix: Matrix2,
    index: number,
    cartesian: Cartesian2,
    result: Matrix2
  ): Matrix2 {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("matrix", matrix);

    Check.typeOf.number.greaterThanOrEquals("index", index, 0);
    Check.typeOf.number.lessThanOrEquals("index", index, 1);

    Check.typeOf.object("cartesian", cartesian);
    Check.typeOf.object("result", result);
    //>>includeEnd('debug');

    result = Matrix2.clone(matrix, result)!;
    const startIndex = index * 2;
    result[startIndex] = cartesian.x;
    result[startIndex + 1] = cartesian.y;
    return result;
  }

  /**
   * Retrieves a copy of the matrix row at the provided index as a Cartesian2 instance.
   *
   * @param matrix - The matrix to use.
   * @param index - The zero-based index of the row to retrieve.
   * @param result - The object onto which to store the result.
   * @returns The modified result parameter.
   *
   * @exception {DeveloperError} index must be 0 or 1.
   */
  static getRow(matrix: Matrix2, index: number, result: Cartesian2): Cartesian2 {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("matrix", matrix);

    Check.typeOf.number.greaterThanOrEquals("index", index, 0);
    Check.typeOf.number.lessThanOrEquals("index", index, 1);

    Check.typeOf.object("result", result);
    //>>includeEnd('debug');

    const x = matrix[index];
    const y = matrix[index + 2];

    result.x = x;
    result.y = y;
    return result;
  }

  /**
   * Computes a new matrix that replaces the specified row in the provided matrix with the provided Cartesian2 instance.
   *
   * @param matrix - The matrix to use.
   * @param index - The zero-based index of the row to set.
   * @param cartesian - The Cartesian whose values will be assigned to the specified row.
   * @param result - The object onto which to store the result.
   * @returns The modified result parameter.
   *
   * @exception {DeveloperError} index must be 0 or 1.
   */
  static setRow(
    matrix: Matrix2,
    index: number,
    cartesian: Cartesian2,
    result: Matrix2
  ): Matrix2 {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("matrix", matrix);

    Check.typeOf.number.greaterThanOrEquals("index", index, 0);
    Check.typeOf.number.lessThanOrEquals("index", index, 1);

    Check.typeOf.object("cartesian", cartesian);
    Check.typeOf.object("result", result);
    //>>includeEnd('debug');

    result = Matrix2.clone(matrix, result)!;
    result[index] = cartesian.x;
    result[index + 2] = cartesian.y;
    return result;
  }

  /**
   * Computes a new matrix that replaces the scale with the provided scale.
   * This assumes the matrix is an affine transformation.
   *
   * @param matrix - The matrix to use.
   * @param scale - The scale that replaces the scale of the provided matrix.
   * @param result - The object onto which to store the result.
   * @returns The modified result parameter.
   *
   * @see Matrix2.setUniformScale
   * @see Matrix2.fromScale
   * @see Matrix2.fromUniformScale
   * @see Matrix2.multiplyByScale
   * @see Matrix2.multiplyByUniformScale
   * @see Matrix2.getScale
   */
  static setScale(matrix: Matrix2, scale: Cartesian2, result: Matrix2): Matrix2 {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("matrix", matrix);
    Check.typeOf.object("scale", scale);
    Check.typeOf.object("result", result);
    //>>includeEnd('debug');

    const existingScale = Matrix2.getScale(matrix, scaleScratch1);
    const scaleRatioX = scale.x / existingScale.x;
    const scaleRatioY = scale.y / existingScale.y;

    result[0] = matrix[0] * scaleRatioX;
    result[1] = matrix[1] * scaleRatioX;
    result[2] = matrix[2] * scaleRatioY;
    result[3] = matrix[3] * scaleRatioY;

    return result;
  }

  /**
   * Computes a new matrix that replaces the scale with the provided uniform scale.
   * This assumes the matrix is an affine transformation.
   *
   * @param matrix - The matrix to use.
   * @param scale - The uniform scale that replaces the scale of the provided matrix.
   * @param result - The object onto which to store the result.
   * @returns The modified result parameter.
   *
   * @see Matrix2.setScale
   * @see Matrix2.fromScale
   * @see Matrix2.fromUniformScale
   * @see Matrix2.multiplyByScale
   * @see Matrix2.multiplyByUniformScale
   * @see Matrix2.getScale
   */
  static setUniformScale(matrix: Matrix2, scale: number, result: Matrix2): Matrix2 {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("matrix", matrix);
    Check.typeOf.number("scale", scale);
    Check.typeOf.object("result", result);
    //>>includeEnd('debug');

    const existingScale = Matrix2.getScale(matrix, scaleScratch2);
    const scaleRatioX = scale / existingScale.x;
    const scaleRatioY = scale / existingScale.y;

    result[0] = matrix[0] * scaleRatioX;
    result[1] = matrix[1] * scaleRatioX;
    result[2] = matrix[2] * scaleRatioY;
    result[3] = matrix[3] * scaleRatioY;

    return result;
  }

  /**
   * Extracts the non-uniform scale assuming the matrix is an affine transformation.
   *
   * @param matrix - The matrix.
   * @param result - The object onto which to store the result.
   * @returns The modified result parameter.
   *
   * @see Matrix2.multiplyByScale
   * @see Matrix2.multiplyByUniformScale
   * @see Matrix2.fromScale
   * @see Matrix2.fromUniformScale
   * @see Matrix2.setScale
   * @see Matrix2.setUniformScale
   */
  static getScale(matrix: Matrix2, result: Cartesian2): Cartesian2 {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("matrix", matrix);
    Check.typeOf.object("result", result);
    //>>includeEnd('debug');

    result.x = Cartesian2.magnitude(
      Cartesian2.fromElements(matrix[0], matrix[1], scratchColumn)
    );
    result.y = Cartesian2.magnitude(
      Cartesian2.fromElements(matrix[2], matrix[3], scratchColumn)
    );
    return result;
  }

  /**
   * Computes the maximum scale assuming the matrix is an affine transformation.
   * The maximum scale is the maximum length of the column vectors.
   *
   * @param matrix - The matrix.
   * @returns The maximum scale.
   */
  static getMaximumScale(matrix: Matrix2): number {
    Matrix2.getScale(matrix, scaleScratch3);
    return Cartesian2.maximumComponent(scaleScratch3);
  }

  /**
   * Sets the rotation assuming the matrix is an affine transformation.
   *
   * @param matrix - The matrix.
   * @param rotation - The rotation matrix.
   * @param result - The object onto which to store the result.
   * @returns The modified result parameter.
   *
   * @see Matrix2.fromRotation
   * @see Matrix2.getRotation
   */
  static setRotation(matrix: Matrix2, rotation: Matrix2, result: Matrix2): Matrix2 {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("matrix", matrix);
    Check.typeOf.object("result", result);
    //>>includeEnd('debug');

    const scale = Matrix2.getScale(matrix, scaleScratch4);

    result[0] = rotation[0] * scale.x;
    result[1] = rotation[1] * scale.x;
    result[2] = rotation[2] * scale.y;
    result[3] = rotation[3] * scale.y;

    return result;
  }

  /**
   * Extracts the rotation matrix assuming the matrix is an affine transformation.
   *
   * @param matrix - The matrix.
   * @param result - The object onto which to store the result.
   * @returns The modified result parameter.
   *
   * @see Matrix2.setRotation
   * @see Matrix2.fromRotation
   */
  static getRotation(matrix: Matrix2, result: Matrix2): Matrix2 {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("matrix", matrix);
    Check.typeOf.object("result", result);
    //>>includeEnd('debug');

    const scale = Matrix2.getScale(matrix, scaleScratch5);

    result[0] = matrix[0] / scale.x;
    result[1] = matrix[1] / scale.x;
    result[2] = matrix[2] / scale.y;
    result[3] = matrix[3] / scale.y;

    return result;
  }

  /**
   * Computes the product of two matrices.
   *
   * @param left - The first matrix.
   * @param right - The second matrix.
   * @param result - The object onto which to store the result.
   * @returns The modified result parameter.
   */
  static multiply(left: Matrix2, right: Matrix2, result: Matrix2): Matrix2 {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("left", left);
    Check.typeOf.object("right", right);
    Check.typeOf.object("result", result);
    //>>includeEnd('debug');

    const column0Row0 = left[0] * right[0] + left[2] * right[1];
    const column1Row0 = left[0] * right[2] + left[2] * right[3];
    const column0Row1 = left[1] * right[0] + left[3] * right[1];
    const column1Row1 = left[1] * right[2] + left[3] * right[3];

    result[0] = column0Row0;
    result[1] = column0Row1;
    result[2] = column1Row0;
    result[3] = column1Row1;
    return result;
  }

  /**
   * Computes the sum of two matrices.
   *
   * @param left - The first matrix.
   * @param right - The second matrix.
   * @param result - The object onto which to store the result.
   * @returns The modified result parameter.
   */
  static add(left: Matrix2, right: Matrix2, result: Matrix2): Matrix2 {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("left", left);
    Check.typeOf.object("right", right);
    Check.typeOf.object("result", result);
    //>>includeEnd('debug');

    result[0] = left[0] + right[0];
    result[1] = left[1] + right[1];
    result[2] = left[2] + right[2];
    result[3] = left[3] + right[3];
    return result;
  }

  /**
   * Computes the difference of two matrices.
   *
   * @param left - The first matrix.
   * @param right - The second matrix.
   * @param result - The object onto which to store the result.
   * @returns The modified result parameter.
   */
  static subtract(left: Matrix2, right: Matrix2, result: Matrix2): Matrix2 {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("left", left);
    Check.typeOf.object("right", right);
    Check.typeOf.object("result", result);
    //>>includeEnd('debug');

    result[0] = left[0] - right[0];
    result[1] = left[1] - right[1];
    result[2] = left[2] - right[2];
    result[3] = left[3] - right[3];
    return result;
  }

  /**
   * Computes the product of a matrix and a column vector.
   *
   * @param matrix - The matrix.
   * @param cartesian - The column.
   * @param result - The object onto which to store the result.
   * @returns The modified result parameter.
   */
  static multiplyByVector(
    matrix: Matrix2,
    cartesian: Cartesian2,
    result: Cartesian2
  ): Cartesian2 {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("matrix", matrix);
    Check.typeOf.object("cartesian", cartesian);
    Check.typeOf.object("result", result);
    //>>includeEnd('debug');

    const x = matrix[0] * cartesian.x + matrix[2] * cartesian.y;
    const y = matrix[1] * cartesian.x + matrix[3] * cartesian.y;

    result.x = x;
    result.y = y;
    return result;
  }

  /**
   * Computes the product of a matrix and a scalar.
   *
   * @param matrix - The matrix.
   * @param scalar - The number to multiply by.
   * @param result - The object onto which to store the result.
   * @returns The modified result parameter.
   */
  static multiplyByScalar(matrix: Matrix2, scalar: number, result: Matrix2): Matrix2 {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("matrix", matrix);
    Check.typeOf.number("scalar", scalar);
    Check.typeOf.object("result", result);
    //>>includeEnd('debug');

    result[0] = matrix[0] * scalar;
    result[1] = matrix[1] * scalar;
    result[2] = matrix[2] * scalar;
    result[3] = matrix[3] * scalar;
    return result;
  }

  /**
   * Computes the product of a matrix times a (non-uniform) scale, as if the scale were a scale matrix.
   *
   * @param matrix - The matrix on the left-hand side.
   * @param scale - The non-uniform scale on the right-hand side.
   * @param result - The object onto which to store the result.
   * @returns The modified result parameter.
   *
   * @example
   * // Instead of Cesium.Matrix2.multiply(m, Cesium.Matrix2.fromScale(scale), m);
   * Cesium.Matrix2.multiplyByScale(m, scale, m);
   *
   * @see Matrix2.multiplyByUniformScale
   * @see Matrix2.fromScale
   * @see Matrix2.fromUniformScale
   * @see Matrix2.setScale
   * @see Matrix2.setUniformScale
   * @see Matrix2.getScale
   */
  static multiplyByScale(
    matrix: Matrix2,
    scale: Cartesian2,
    result: Matrix2
  ): Matrix2 {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("matrix", matrix);
    Check.typeOf.object("scale", scale);
    Check.typeOf.object("result", result);
    //>>includeEnd('debug');

    result[0] = matrix[0] * scale.x;
    result[1] = matrix[1] * scale.x;
    result[2] = matrix[2] * scale.y;
    result[3] = matrix[3] * scale.y;

    return result;
  }

  /**
   * Computes the product of a matrix times a uniform scale, as if the scale were a scale matrix.
   *
   * @param matrix - The matrix on the left-hand side.
   * @param scale - The uniform scale on the right-hand side.
   * @param result - The object onto which to store the result.
   * @returns The modified result parameter.
   *
   * @example
   * // Instead of Cesium.Matrix2.multiply(m, Cesium.Matrix2.fromUniformScale(scale), m);
   * Cesium.Matrix2.multiplyByUniformScale(m, scale, m);
   *
   * @see Matrix2.multiplyByScale
   * @see Matrix2.fromScale
   * @see Matrix2.fromUniformScale
   * @see Matrix2.setScale
   * @see Matrix2.setUniformScale
   * @see Matrix2.getScale
   */
  static multiplyByUniformScale(
    matrix: Matrix2,
    scale: number,
    result: Matrix2
  ): Matrix2 {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("matrix", matrix);
    Check.typeOf.number("scale", scale);
    Check.typeOf.object("result", result);
    //>>includeEnd('debug');

    result[0] = matrix[0] * scale;
    result[1] = matrix[1] * scale;
    result[2] = matrix[2] * scale;
    result[3] = matrix[3] * scale;

    return result;
  }

  /**
   * Creates a negated copy of the provided matrix.
   *
   * @param matrix - The matrix to negate.
   * @param result - The object onto which to store the result.
   * @returns The modified result parameter.
   */
  static negate(matrix: Matrix2, result: Matrix2): Matrix2 {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("matrix", matrix);
    Check.typeOf.object("result", result);
    //>>includeEnd('debug');

    result[0] = -matrix[0];
    result[1] = -matrix[1];
    result[2] = -matrix[2];
    result[3] = -matrix[3];
    return result;
  }

  /**
   * Computes the transpose of the provided matrix.
   *
   * @param matrix - The matrix to transpose.
   * @param result - The object onto which to store the result.
   * @returns The modified result parameter.
   */
  static transpose(matrix: Matrix2, result: Matrix2): Matrix2 {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("matrix", matrix);
    Check.typeOf.object("result", result);
    //>>includeEnd('debug');

    const column0Row0 = matrix[0];
    const column0Row1 = matrix[2];
    const column1Row0 = matrix[1];
    const column1Row1 = matrix[3];

    result[0] = column0Row0;
    result[1] = column0Row1;
    result[2] = column1Row0;
    result[3] = column1Row1;
    return result;
  }

  /**
   * Computes a matrix, which contains the absolute (unsigned) values of the provided matrix's elements.
   *
   * @param matrix - The matrix with signed elements.
   * @param result - The object onto which to store the result.
   * @returns The modified result parameter.
   */
  static abs(matrix: Matrix2, result: Matrix2): Matrix2 {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("matrix", matrix);
    Check.typeOf.object("result", result);
    //>>includeEnd('debug');

    result[0] = Math.abs(matrix[0]);
    result[1] = Math.abs(matrix[1]);
    result[2] = Math.abs(matrix[2]);
    result[3] = Math.abs(matrix[3]);

    return result;
  }

  /**
   * Compares the provided matrices componentwise and returns
   * true if they are equal, false otherwise.
   *
   * @param left - The first matrix.
   * @param right - The second matrix.
   * @returns true if left and right are equal, false otherwise.
   */
  static equals(left?: Matrix2, right?: Matrix2): boolean {
    return (
      left === right ||
      (defined(left) &&
        defined(right) &&
        left![0] === right![0] &&
        left![1] === right![1] &&
        left![2] === right![2] &&
        left![3] === right![3])
    );
  }

  /**
   * @private
   */
  static equalsArray(matrix: Matrix2, array: number[], offset: number): boolean {
    return (
      matrix[0] === array[offset] &&
      matrix[1] === array[offset + 1] &&
      matrix[2] === array[offset + 2] &&
      matrix[3] === array[offset + 3]
    );
  }

  /**
   * Compares the provided matrices componentwise and returns
   * true if they are within the provided epsilon,
   * false otherwise.
   *
   * @param left - The first matrix.
   * @param right - The second matrix.
   * @param epsilon - The epsilon to use for equality testing. Default is 0.
   * @returns true if left and right are within the provided epsilon, false otherwise.
   */
  static equalsEpsilon(
    left?: Matrix2,
    right?: Matrix2,
    epsilon: number = 0
  ): boolean {
    return (
      left === right ||
      (defined(left) &&
        defined(right) &&
        Math.abs(left![0] - right![0]) <= epsilon &&
        Math.abs(left![1] - right![1]) <= epsilon &&
        Math.abs(left![2] - right![2]) <= epsilon &&
        Math.abs(left![3] - right![3]) <= epsilon)
    );
  }

  /**
   * Duplicates the provided Matrix2 instance.
   *
   * @param result - The object onto which to store the result.
   * @returns The modified result parameter or a new Matrix2 instance if one was not provided.
   */
  clone(result?: Matrix2): Matrix2 {
    return Matrix2.clone(this, result)!;
  }

  /**
   * Compares this matrix to the provided matrix componentwise and returns
   * true if they are equal, false otherwise.
   *
   * @param right - The right hand side matrix.
   * @returns true if they are equal, false otherwise.
   */
  equals(right?: Matrix2): boolean {
    return Matrix2.equals(this, right);
  }

  /**
   * Compares this matrix to the provided matrix componentwise and returns
   * true if they are within the provided epsilon,
   * false otherwise.
   *
   * @param right - The right hand side matrix.
   * @param epsilon - The epsilon to use for equality testing. Default is 0.
   * @returns true if they are within the provided epsilon, false otherwise.
   */
  equalsEpsilon(right?: Matrix2, epsilon: number = 0): boolean {
    return Matrix2.equalsEpsilon(this, right, epsilon);
  }

  /**
   * Creates a string representing this Matrix with each row being
   * on a separate line and in the format '(column0, column1)'.
   *
   * @returns A string representing the provided Matrix with each row being on a separate line and in the format '(column0, column1)'.
   */
  toString(): string {
    return `(${this[0]}, ${this[2]})\n` + `(${this[1]}, ${this[3]})`;
  }
}

// Scratch variables for internal use
const scaleScratch1 = new Cartesian2();
const scaleScratch2 = new Cartesian2();
const scaleScratch3 = new Cartesian2();
const scaleScratch4 = new Cartesian2();
const scaleScratch5 = new Cartesian2();
const scratchColumn = new Cartesian2();

export default Matrix2;
