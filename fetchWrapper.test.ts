import { fetchWrapper, hydrateHtmlWithTemplate } from './fetchWrapper';

import fetchMock from 'jest-fetch-mock';

describe('fetchWrapper', () => {
  it('should return a JSON object', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ message: 'success' }),
      })
    ) as jest.Mock;

    const response = await fetchWrapper<{ message: string }>(
      'https://example.com',
      { debug: true }
    );
    expect(response).toEqual({ message: 'success' });
  });
});

describe('fetchWrapper Timeout', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should throw a timeout error when the request exceeds the specified timeout duration', async () => {
    (global.fetch as jest.Mock).mockImplementation(
      () =>
        new Promise((resolve) => setTimeout(() => resolve({ ok: true }), 105))
    );

    await expect(
      fetchWrapper<any>('https://example.com', { timeout: 100 })
    ).rejects.toThrow('Request timed out');
  });
});

beforeAll(() => {
  fetchMock.enableMocks();
});

beforeEach(() => {
  fetchMock.resetMocks();
});

describe('hydrateHtmlWithTemplate', () => {
  it('should replace template markers with data from the API', async () => {
    const apiResponse = {
      title: 'Test Title',
      description: 'Test Description',
    };
    fetchMock.mockResponseOnce(JSON.stringify(apiResponse));

    const htmlTemplate = `
<!DOCTYPE html>
<html>
<head>
    <title>{{title}}</title>
</head>
<body>
    <h1>{{title}}</h1>
    <p>{{description}}</p>
</body>
</html>
    `;

    const templateMarkers = {
      title: '{{title}}',
      description: '{{description}}',
    };

    const expectedHtml = `
<!DOCTYPE html>
<html>
<head>
    <title>Test Title</title>
</head>
<body>
    <h1>Test Title</h1>
    <p>Test Description</p>
</body>
</html>
    `;

    const hydratedHtml = await hydrateHtmlWithTemplate(
      'https://api.example.com/data',
      htmlTemplate,
      templateMarkers
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith('https://api.example.com/data', {
      debug: true,
    });
    expect(hydratedHtml.trim()).toBe(expectedHtml.trim());
  });
});
