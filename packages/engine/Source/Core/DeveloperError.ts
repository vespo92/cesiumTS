/**
 * Constructs an exception object that is thrown due to a developer error, e.g., invalid argument,
 * argument out of range, etc.  This exception should only be thrown during development;
 * it usually indicates a bug in the calling code.  This exception should never be
 * caught; instead the calling code should strive not to generate it.
 * <br /><br />
 * On the other hand, a {@link RuntimeError} indicates an exception that may
 * be thrown at runtime, e.g., out of memory, that the calling code should be prepared
 * to catch.
 *
 * @extends Error
 *
 * @param message - The error message for this exception.
 *
 * @see RuntimeError
 */
class DeveloperError extends Error {
  /**
   * 'DeveloperError' indicating that this exception was thrown due to a developer error.
   * @readonly
   */
  override readonly name: string = "DeveloperError";

  /**
   * The explanation for why this exception was thrown.
   * @readonly
   */
  override readonly message: string;

  /**
   * The stack trace of this exception, if available.
   * @readonly
   */
  override readonly stack?: string;

  constructor(message?: string) {
    super(message);

    this.message = message ?? "";

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DeveloperError);
    }

    // Set the prototype explicitly for proper instanceof checks
    Object.setPrototypeOf(this, DeveloperError.prototype);
  }

  /**
   * Returns a string representation of this error.
   * @returns The string representation.
   */
  override toString(): string {
    let str = `${this.name}: ${this.message}`;

    if (this.stack !== undefined) {
      str += `\n${this.stack}`;
    }

    return str;
  }

  /**
   * Throws a DeveloperError indicating that a function defines an interface
   * and should not be called directly.
   * @throws {DeveloperError} Always throws.
   * @private
   */
  static throwInstantiationError(): never {
    throw new DeveloperError(
      "This function defines an interface and should not be called directly."
    );
  }
}

export default DeveloperError;
