import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";

/**
 * Type for a basic type check function
 */
type TypeCheckFunction = (name: string, test: unknown) => void;

/**
 * Type for number comparison functions
 */
type NumberCompareFunction = (name: string, test: number, limit: number) => void;

/**
 * Type for number equality check function
 */
type NumberEqualsFunction = (
  name1: string,
  name2: string,
  test1: number,
  test2: number
) => void;

/**
 * Interface for the number check function with additional comparison methods
 */
interface NumberCheckFunction {
  (name: string, test: unknown): void;
  lessThan: NumberCompareFunction;
  lessThanOrEquals: NumberCompareFunction;
  greaterThan: NumberCompareFunction;
  greaterThanOrEquals: NumberCompareFunction;
  equals: NumberEqualsFunction;
}

/**
 * Interface for the typeOf namespace containing type checking functions
 */
interface TypeOfChecks {
  func: TypeCheckFunction;
  string: TypeCheckFunction;
  number: NumberCheckFunction;
  object: TypeCheckFunction;
  bool: TypeCheckFunction;
  bigint: TypeCheckFunction;
}

/**
 * Interface for the Check module
 */
interface CheckInterface {
  typeOf: TypeOfChecks;
  defined: (name: string, test: unknown) => void;
  getUndefinedErrorMessage: (name: string) => string;
}

/**
 * Returns the error message for undefined values
 * @param name - The name of the variable being tested
 * @returns The error message string
 */
function getUndefinedErrorMessage(name: string): string {
  return `${name} is required, actual value was undefined`;
}

/**
 * Returns the error message for type check failures
 * @param actual - The actual type that was found
 * @param expected - The expected type
 * @param name - The name of the variable being tested
 * @returns The error message string
 */
function getFailedTypeErrorMessage(
  actual: string,
  expected: string,
  name: string
): string {
  return `Expected ${name} to be typeof ${expected}, actual typeof was ${actual}`;
}

/**
 * Throws if test is not typeof 'number'
 *
 * @param name - The name of the variable being tested
 * @param test - The value to test
 * @throws DeveloperError if test is not typeof 'number'
 */
const numberCheck = function (name: string, test: unknown): void {
  if (typeof test !== "number") {
    throw new DeveloperError(
      getFailedTypeErrorMessage(typeof test, "number", name)
    );
  }
} as NumberCheckFunction;

/**
 * Throws if test is not typeof 'number' and less than limit
 *
 * @param name - The name of the variable being tested
 * @param test - The value to test
 * @param limit - The limit value to compare against
 * @throws DeveloperError if test is not typeof 'number' or not less than limit
 */
numberCheck.lessThan = function (
  name: string,
  test: number,
  limit: number
): void {
  numberCheck(name, test);
  if (test >= limit) {
    throw new DeveloperError(
      `Expected ${name} to be less than ${limit}, actual value was ${test}`
    );
  }
};

/**
 * Throws if test is not typeof 'number' and less than or equal to limit
 *
 * @param name - The name of the variable being tested
 * @param test - The value to test
 * @param limit - The limit value to compare against
 * @throws DeveloperError if test is not typeof 'number' or not less than or equal to limit
 */
numberCheck.lessThanOrEquals = function (
  name: string,
  test: number,
  limit: number
): void {
  numberCheck(name, test);
  if (test > limit) {
    throw new DeveloperError(
      `Expected ${name} to be less than or equal to ${limit}, actual value was ${test}`
    );
  }
};

/**
 * Throws if test is not typeof 'number' and greater than limit
 *
 * @param name - The name of the variable being tested
 * @param test - The value to test
 * @param limit - The limit value to compare against
 * @throws DeveloperError if test is not typeof 'number' or not greater than limit
 */
numberCheck.greaterThan = function (
  name: string,
  test: number,
  limit: number
): void {
  numberCheck(name, test);
  if (test <= limit) {
    throw new DeveloperError(
      `Expected ${name} to be greater than ${limit}, actual value was ${test}`
    );
  }
};

/**
 * Throws if test is not typeof 'number' and greater than or equal to limit
 *
 * @param name - The name of the variable being tested
 * @param test - The value to test
 * @param limit - The limit value to compare against
 * @throws DeveloperError if test is not typeof 'number' or not greater than or equal to limit
 */
numberCheck.greaterThanOrEquals = function (
  name: string,
  test: number,
  limit: number
): void {
  numberCheck(name, test);
  if (test < limit) {
    throw new DeveloperError(
      `Expected ${name} to be greater than or equal to ${limit}, actual value was ${test}`
    );
  }
};

/**
 * Throws if test1 and test2 are not typeof 'number' or not equal in value
 *
 * @param name1 - The name of the first variable being tested
 * @param name2 - The name of the second variable being tested against
 * @param test1 - The value to test
 * @param test2 - The value to test against
 * @throws DeveloperError if test1 and test2 are not typeof 'number' or not equal
 */
numberCheck.equals = function (
  name1: string,
  name2: string,
  test1: number,
  test2: number
): void {
  numberCheck(name1, test1);
  numberCheck(name2, test2);
  if (test1 !== test2) {
    throw new DeveloperError(
      `${name1} must be equal to ${name2}, the actual values are ${test1} and ${test2}`
    );
  }
};

/**
 * Contains functions for checking that supplied arguments are of a specified type
 * or meet specified conditions
 */
const Check: CheckInterface = {
  /**
   * Contains type checking functions, all using the typeof operator
   */
  typeOf: {
    /**
     * Throws if test is not typeof 'function'
     *
     * @param name - The name of the variable being tested
     * @param test - The value to test
     * @throws DeveloperError if test is not typeof 'function'
     */
    func: function (name: string, test: unknown): void {
      if (typeof test !== "function") {
        throw new DeveloperError(
          getFailedTypeErrorMessage(typeof test, "function", name)
        );
      }
    },

    /**
     * Throws if test is not typeof 'string'
     *
     * @param name - The name of the variable being tested
     * @param test - The value to test
     * @throws DeveloperError if test is not typeof 'string'
     */
    string: function (name: string, test: unknown): void {
      if (typeof test !== "string") {
        throw new DeveloperError(
          getFailedTypeErrorMessage(typeof test, "string", name)
        );
      }
    },

    /**
     * Number type check with comparison methods
     */
    number: numberCheck,

    /**
     * Throws if test is not typeof 'object'
     *
     * @param name - The name of the variable being tested
     * @param test - The value to test
     * @throws DeveloperError if test is not typeof 'object'
     */
    object: function (name: string, test: unknown): void {
      if (typeof test !== "object") {
        throw new DeveloperError(
          getFailedTypeErrorMessage(typeof test, "object", name)
        );
      }
    },

    /**
     * Throws if test is not typeof 'boolean'
     *
     * @param name - The name of the variable being tested
     * @param test - The value to test
     * @throws DeveloperError if test is not typeof 'boolean'
     */
    bool: function (name: string, test: unknown): void {
      if (typeof test !== "boolean") {
        throw new DeveloperError(
          getFailedTypeErrorMessage(typeof test, "boolean", name)
        );
      }
    },

    /**
     * Throws if test is not typeof 'bigint'
     *
     * @param name - The name of the variable being tested
     * @param test - The value to test
     * @throws DeveloperError if test is not typeof 'bigint'
     */
    bigint: function (name: string, test: unknown): void {
      if (typeof test !== "bigint") {
        throw new DeveloperError(
          getFailedTypeErrorMessage(typeof test, "bigint", name)
        );
      }
    },
  },

  /**
   * Throws if test is not defined
   *
   * @param name - The name of the variable being tested
   * @param test - The value that is to be checked
   * @throws DeveloperError if test is undefined
   */
  defined: function (name: string, test: unknown): void {
    if (!defined(test)) {
      throw new DeveloperError(getUndefinedErrorMessage(name));
    }
  },

  /**
   * Returns the error message for undefined values
   * @param name - The name of the variable being tested
   * @returns The error message string
   */
  getUndefinedErrorMessage: getUndefinedErrorMessage,
};

export default Check;
