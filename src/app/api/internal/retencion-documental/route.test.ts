import { POST } from "./route";
import {
  getDocumentRetentionService,
  isDocumentDataConfigured,
} from "@/lib/application-services";
import {
  getDocumentRetentionJobToken,
  isDocumentRetentionJobConfigured,
} from "@/lib/env";

jest.mock("@/lib/application-services");
jest.mock("@/lib/env");

describe("POST /api/internal/retencion-documental", () => {
  const mockIsDocumentDataConfigured = isDocumentDataConfigured as jest.Mock;
  const mockGetDocumentRetentionService = getDocumentRetentionService as jest.Mock;
  const mockGetDocumentRetentionJobToken = getDocumentRetentionJobToken as jest.Mock;
  const mockIsDocumentRetentionJobConfigured = isDocumentRetentionJobConfigured as jest.Mock;

  const validToken = "valid-secret-token-for-job-12345678";

  beforeEach(() => {
    jest.clearAllMocks();
    mockIsDocumentDataConfigured.mockReturnValue(true);
    mockIsDocumentRetentionJobConfigured.mockReturnValue(true);
    mockGetDocumentRetentionJobToken.mockReturnValue(validToken);
  });

  it("should return 503 if document data is not configured", async () => {
    mockIsDocumentDataConfigured.mockReturnValue(false);

    const request = new Request("http://localhost/api/internal/retencion-documental", {
      method: "POST",
    });

    const response = await POST(request);
    expect(response.status).toBe(503);
    const data = await response.json();
    expect(data.error).toBe("El proceso de retención documental no está configurado.");
  });

  it("should return 503 if document retention job is not configured", async () => {
    mockIsDocumentRetentionJobConfigured.mockReturnValue(false);

    const request = new Request("http://localhost/api/internal/retencion-documental", {
      method: "POST",
    });

    const response = await POST(request);
    expect(response.status).toBe(503);
    const data = await response.json();
    expect(data.error).toBe("El proceso de retención documental no está configurado.");
  });

  it("should return 401 if authorization header is missing", async () => {
    const request = new Request("http://localhost/api/internal/retencion-documental", {
      method: "POST",
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe("Credencial interna no válida.");
  });

  it("should return 401 if authorization header is incorrect", async () => {
    const request = new Request("http://localhost/api/internal/retencion-documental", {
      method: "POST",
      headers: {
        Authorization: "Bearer invalid-token",
      },
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe("Credencial interna no válida.");
  });

  it("should return 200 and execution result if authorized and job succeeds", async () => {
    const mockRun = jest.fn().mockResolvedValue({
      scanned: 10,
      deleted: 5,
      skipped: 5,
      failed: 0,
    });
    mockGetDocumentRetentionService.mockReturnValue({ run: mockRun });

    const request = new Request("http://localhost/api/internal/retencion-documental?limit=25", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${validToken}`,
      },
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.ok).toBe(true);
    expect(data.scanned).toBe(10);
    expect(data.deleted).toBe(5);
    expect(data.skipped).toBe(5);
    expect(data.failed).toBe(0);
    expect(mockRun).toHaveBeenCalledWith(25);
  });

  it("should handle default limit and invalid limits", async () => {
    const mockRun = jest.fn().mockResolvedValue({
      scanned: 0,
      deleted: 0,
      skipped: 0,
      failed: 0,
    });
    mockGetDocumentRetentionService.mockReturnValue({ run: mockRun });

    const request1 = new Request("http://localhost/api/internal/retencion-documental", {
      method: "POST",
      headers: { Authorization: `Bearer ${validToken}` },
    });
    await POST(request1);
    expect(mockRun).toHaveBeenLastCalledWith(50); // Default

    const request2 = new Request("http://localhost/api/internal/retencion-documental?limit=abc", {
      method: "POST",
      headers: { Authorization: `Bearer ${validToken}` },
    });
    await POST(request2);
    expect(mockRun).toHaveBeenLastCalledWith(50); // Invalid parseInt gives NaN, Number.isFinite(NaN) is false

    const request3 = new Request("http://localhost/api/internal/retencion-documental?limit=-10", {
      method: "POST",
      headers: { Authorization: `Bearer ${validToken}` },
    });
    await POST(request3);
    expect(mockRun).toHaveBeenLastCalledWith(1); // Min limit is 1

    const request4 = new Request("http://localhost/api/internal/retencion-documental?limit=200", {
      method: "POST",
      headers: { Authorization: `Bearer ${validToken}` },
    });
    await POST(request4);
    expect(mockRun).toHaveBeenLastCalledWith(100); // Max limit is 100
  });

  it("should return 500 if job returns failed items", async () => {
    const mockRun = jest.fn().mockResolvedValue({
      scanned: 10,
      deleted: 8,
      skipped: 0,
      failed: 2,
    });
    mockGetDocumentRetentionService.mockReturnValue({ run: mockRun });
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    const request = new Request("http://localhost/api/internal/retencion-documental", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${validToken}`,
      },
    });

    const response = await POST(request);
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.ok).toBe(false);
    expect(data.failed).toBe(2);

    consoleErrorSpy.mockRestore();
  });

  it("should return 500 if job throws an error", async () => {
    const mockRun = jest.fn().mockRejectedValue(new Error("Database error"));
    mockGetDocumentRetentionService.mockReturnValue({ run: mockRun });
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    const request = new Request("http://localhost/api/internal/retencion-documental", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${validToken}`,
      },
    });

    const response = await POST(request);
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe("No pudimos ejecutar la retención documental.");

    consoleErrorSpy.mockRestore();
  });
});
