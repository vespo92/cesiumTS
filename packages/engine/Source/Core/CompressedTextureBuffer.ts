import defined from "./defined.js";

/**
 * Describes a compressed texture and contains a compressed texture buffer.
 * @alias CompressedTextureBuffer
 */
class CompressedTextureBuffer {
  private _format: number;
  private _datatype: number;
  private _width: number;
  private _height: number;
  private _buffer: Uint8Array;

  /**
   * Creates a new CompressedTextureBuffer.
   * @param internalFormat - The pixel format of the compressed texture.
   * @param pixelDatatype - The pixel datatype of the compressed texture.
   * @param width - The width of the texture.
   * @param height - The height of the texture.
   * @param buffer - The compressed texture buffer.
   */
  constructor(
    internalFormat: number,
    pixelDatatype: number,
    width: number,
    height: number,
    buffer: Uint8Array,
  ) {
    this._format = internalFormat;
    this._datatype = pixelDatatype;
    this._width = width;
    this._height = height;
    this._buffer = buffer;
  }

  /**
   * The format of the compressed texture.
   */
  get internalFormat(): number {
    return this._format;
  }

  /**
   * The datatype of the compressed texture.
   */
  get pixelDatatype(): number {
    return this._datatype;
  }

  /**
   * The width of the texture.
   */
  get width(): number {
    return this._width;
  }

  /**
   * The height of the texture.
   */
  get height(): number {
    return this._height;
  }

  /**
   * The compressed texture buffer.
   */
  get bufferView(): Uint8Array {
    return this._buffer;
  }

  /**
   * The compressed texture buffer. Alias for bufferView.
   */
  get arrayBufferView(): Uint8Array {
    return this._buffer;
  }

  /**
   * Creates a shallow clone of a compressed texture buffer.
   *
   * @param object - The compressed texture buffer to be cloned.
   * @returns A shallow clone of the compressed texture buffer.
   */
  static clone(
    object: CompressedTextureBuffer | undefined,
  ): CompressedTextureBuffer | undefined {
    if (!defined(object)) {
      return undefined;
    }

    return new CompressedTextureBuffer(
      object!._format,
      object!._datatype,
      object!._width,
      object!._height,
      object!._buffer,
    );
  }

  /**
   * Creates a shallow clone of this compressed texture buffer.
   *
   * @returns A shallow clone of the compressed texture buffer.
   */
  clone(): CompressedTextureBuffer | undefined {
    return CompressedTextureBuffer.clone(this);
  }
}

export default CompressedTextureBuffer;
