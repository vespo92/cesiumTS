import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";

/**
 * A collection of key-value pairs that is stored as a hash for easy
 * lookup but also provides an array for fast iteration.
 * @alias AssociativeArray
 */
class AssociativeArray<T = unknown> {
  private _array: T[];
  private _hash: Record<string | number, T>;

  /**
   * Creates a new AssociativeArray.
   */
  constructor() {
    this._array = [];
    this._hash = {};
  }

  /**
   * Gets the number of items in the collection.
   */
  get length(): number {
    return this._array.length;
  }

  /**
   * Gets an unordered array of all values in the collection.
   * This is a live array that will automatically reflect the values in the collection,
   * it should not be modified directly.
   */
  get values(): T[] {
    return this._array;
  }

  /**
   * Determines if the provided key is in the array.
   *
   * @param key - The key to check.
   * @returns true if the key is in the array, false otherwise.
   */
  contains(key: string | number): boolean {
    //>>includeStart('debug', pragmas.debug);
    if (typeof key !== "string" && typeof key !== "number") {
      throw new DeveloperError("key is required to be a string or number.");
    }
    //>>includeEnd('debug');
    return defined(this._hash[key]);
  }

  /**
   * Associates the provided key with the provided value. If the key already
   * exists, it is overwritten with the new value.
   *
   * @param key - A unique identifier.
   * @param value - The value to associate with the provided key.
   */
  set(key: string | number, value: T): void {
    //>>includeStart('debug', pragmas.debug);
    if (typeof key !== "string" && typeof key !== "number") {
      throw new DeveloperError("key is required to be a string or number.");
    }
    //>>includeEnd('debug');

    const oldValue = this._hash[key];
    if (value !== oldValue) {
      this.remove(key);
      this._hash[key] = value;
      this._array.push(value);
    }
  }

  /**
   * Retrieves the value associated with the provided key.
   *
   * @param key - The key whose value is to be retrieved.
   * @returns The associated value, or undefined if the key does not exist in the collection.
   */
  get(key: string | number): T | undefined {
    //>>includeStart('debug', pragmas.debug);
    if (typeof key !== "string" && typeof key !== "number") {
      throw new DeveloperError("key is required to be a string or number.");
    }
    //>>includeEnd('debug');
    return this._hash[key];
  }

  /**
   * Removes a key-value pair from the collection.
   *
   * @param key - The key to be removed.
   * @returns True if it was removed, false if the key was not in the collection.
   */
  remove(key: string | number): boolean {
    //>>includeStart('debug', pragmas.debug);
    if (defined(key) && typeof key !== "string" && typeof key !== "number") {
      throw new DeveloperError("key is required to be a string or number.");
    }
    //>>includeEnd('debug');

    const value = this._hash[key];
    const hasValue = defined(value);
    if (hasValue) {
      const array = this._array;
      array.splice(array.indexOf(value), 1);
      delete this._hash[key];
    }
    return hasValue;
  }

  /**
   * Clears the collection.
   */
  removeAll(): void {
    const array = this._array;
    if (array.length > 0) {
      this._hash = {};
      array.length = 0;
    }
  }
}

export default AssociativeArray;
