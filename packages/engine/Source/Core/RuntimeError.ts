/**
 * Constructs an exception object that is thrown due to an error that can occur at runtime, e.g.,
 * out of memory, could not compile shader, etc.  If a function may throw this
 * exception, the calling code should be prepared to catch it.
 * <br /><br />
 * On the other hand, a {@link DeveloperError} indicates an exception due
 * to a developer error, e.g., invalid argument, that usually indicates a bug in the
 * calling code.
 *
 * @extends Error
 *
 * @param message - The error message for this exception.
 *
 * @see DeveloperError
 */
class RuntimeError extends Error {
  /**
   * 'RuntimeError' indicating that this exception was thrown due to a runtime error.
   * @readonly
   */
  override readonly name: string = "RuntimeError";

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

    // Maintains proper stack trace for where error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, RuntimeError);
    }

    // Ensure prototype chain is properly set up for instanceof checks
    Object.setPrototypeOf(this, RuntimeError.prototype);
  }

  override toString(): string {
    let str = `${this.name}: ${this.message}`;

    if (this.stack !== undefined) {
      str += `\n${this.stack}`;
    }

    return str;
  }
}

export default RuntimeError;
