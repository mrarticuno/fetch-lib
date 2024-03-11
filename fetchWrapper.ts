function timeoutPromise(timeout: number): Promise<Response> {
  return new Promise((_, reject) =>
    setTimeout(() => reject(new Error("Request timed out")), timeout)
  );
}

/**
 * Wraps the fetch function with additional features such as timeout, retries, and debug logging.
 *
 * @template T - The expected type of the response data.
 * @param {RequestInfo} input - The URL or Request object to fetch.
 * @param {RequestInit & { timeout?: number; debug?: boolean; }} [init] - The options for the fetch request, including timeout and debug settings.
 * @param {number} [retries=3] - The number of retries to attempt if the request fails.
 * @param {number} [retryDelay=500] - The delay in milliseconds between retries.
 * @returns {Promise<T>} - A Promise that resolves to the parsed response data.
 * @throws {Error} - If the network response is not ok or if all retries fail.
 */
async function fetchWrapper<T>(
  input: RequestInfo,
  init?: RequestInit & {
    timeout?: number;
    debug?: boolean;
  },
  retries: number = 3,
  retryDelay: number = 500
): Promise<T> {
  const { timeout = 5000, debug = false, ...restInit } = init || {};

  if (debug) console.log(`fetchWrapper: Starting request to ${input}`);

  try {
    const fetchPromise = fetch(input, restInit);
    const response = await Promise.race([
      fetchPromise,
      timeoutPromise(timeout),
    ]);

    if (debug) console.log(`fetchWrapper: Request to ${input} completed`);

    if (!response.ok) {
      throw new Error(`fetchWrapper: Network response was not ok for ${input}`);
    }

    return response.json() as Promise<T>;
  } catch (error) {
    if (debug)
      console.log(
        `fetchWrapper: Request to ${input} failed with error: ${error}`
      );

    if (retries > 0) {
      if (debug)
        console.log(
          `fetchWrapper: Retrying request to ${input}, ${retries} retries left`
        );
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
      return fetchWrapper<T>(input, { ...init }, retries - 1, retryDelay);
    } else {
      throw error;
    }
  }
}

export { fetchWrapper };
