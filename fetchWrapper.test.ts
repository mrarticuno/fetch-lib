import { fetchWrapper } from "./fetchWrapper"; // Adjust the import path as necessary

describe("fetchWrapper", () => {
  it("should return a JSON object", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ message: "success" }),
      })
    ) as jest.Mock;

    const response = await fetchWrapper<{ message: string }>(
      "https://example.com",
      { debug: true }
    );
    expect(response).toEqual({ message: "success" });
  });
});

describe("fetchWrapper Timeout", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("should throw a timeout error when the request exceeds the specified timeout duration", async () => {
    (global.fetch as jest.Mock).mockImplementation(
      () =>
        new Promise((resolve) => setTimeout(() => resolve({ ok: true }), 105))
    );

    await expect(
      fetchWrapper<any>("https://example.com", { timeout: 100 })
    ).rejects.toThrow("Request timed out");
  });
});
