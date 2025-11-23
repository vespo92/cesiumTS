/**
 * A simple proxy that appends the desired resource as the sole query parameter
 * to the given proxy URL.
 *
 * @alias DefaultProxy
 * @extends Proxy
 */
class DefaultProxy {
  /**
   * The proxy URL that will be used to request all resources.
   */
  proxy: string;

  /**
   * Creates a new DefaultProxy.
   * @param proxy - The proxy URL that will be used to request all resources.
   */
  constructor(proxy: string) {
    this.proxy = proxy;
  }

  /**
   * Get the final URL to use to request a given resource.
   *
   * @param resource - The resource to request.
   * @returns The proxied resource URL.
   */
  getURL(resource: string): string {
    const prefix = this.proxy.indexOf("?") === -1 ? "?" : "";
    return this.proxy + prefix + encodeURIComponent(resource);
  }
}

export default DefaultProxy;
