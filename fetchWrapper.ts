function timeoutPromise(timeout: number): Promise<Response> {
  return new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Request timed out')), timeout)
  );
}

/**
 * Hydrates an HTML template with data from a given URL.
 *
 * @param url - The URL to fetch the data from.
 * @param htmlTemplate - The HTML template to hydrate.
 * @param templateMarkers - An object containing key-value pairs where the key represents a placeholder in the template and the value represents the corresponding data key in the fetched response.
 * @returns A Promise that resolves to the hydrated HTML.
 * @throws If there is an error while hydrating the HTML.
 */
async function hydrateHtmlWithTemplate(
  url: string,
  htmlTemplate: string,
  templateMarkers: { [key: string]: string }
): Promise<string> {
  try {
    const responseData = await fetchWrapper<any>(url, { debug: true });
    let hydratedHtml = htmlTemplate;

    Object.entries(templateMarkers).forEach(([key, marker]) => {
      hydratedHtml = hydratedHtml.replace(
        new RegExp(marker, 'g'),
        responseData[key]
      );
    });

    return hydratedHtml;
  } catch (error) {
    console.error('Error hydrating HTML with template: ', error);
    throw error;
  }
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

export { fetchWrapper, hydrateHtmlWithTemplate };
