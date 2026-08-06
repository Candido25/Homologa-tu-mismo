jest.mock("server-only", () => {
  return {};
});

import { SupabaseCaseRepository } from "./supabase-case-repository";
import { createClient } from "@/lib/supabase/server";

// Mock the createClient from next-supabase/server
jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(),
}));

describe("SupabaseCaseRepository", () => {
  describe("listRecentByUser", () => {
    it("should throw an Error with the correct message when Supabase returns an error", async () => {
      // Arrange
      const mockUserId = "test-user-id";
      const mockLimit = 10;
      const mockError = { code: "SOME_DB_ERROR", message: "Database connection failed" };

      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: null, error: mockError }),
      };

      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      const repository = new SupabaseCaseRepository();

      // Act & Assert
      await expect(repository.listRecentByUser(mockUserId, mockLimit))
        .rejects
        .toThrow(`No se pudieron leer los expedientes: ${mockError.code}`);

      expect(mockSupabase.from).toHaveBeenCalledWith("cases");
      expect(mockSupabase.select).toHaveBeenCalledWith("id,title,degree_name,procedure_type,status,tier,current_stage,updated_at");
      expect(mockSupabase.eq).toHaveBeenCalledWith("user_id", mockUserId);
      expect(mockSupabase.order).toHaveBeenCalledWith("updated_at", { ascending: false });
      expect(mockSupabase.limit).toHaveBeenCalledWith(mockLimit);
    });

    it("should return mapped cases when successful", async () => {
      // Arrange
      const mockUserId = "test-user-id";
      const mockLimit = 10;

      const mockData = [
        {
          id: "case-1",
          title: "Case 1",
          degree_name: "Computer Science",
          procedure_type: "EQUIVALENCIA",
          status: "DRAFT",
          tier: "FREE",
          current_stage: "PREPARACION_DOCUMENTAL",
          updated_at: "2023-01-01T00:00:00Z"
        }
      ];

      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: mockData, error: null }),
      };

      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      const repository = new SupabaseCaseRepository();

      // Act
      const result = await repository.listRecentByUser(mockUserId, mockLimit);

      // Assert
      expect(result).toEqual([
        {
          id: "case-1",
          title: "Case 1",
          degreeName: "Computer Science",
          procedureType: "EQUIVALENCIA",
          status: "DRAFT",
          tier: "FREE",
          currentStage: "PREPARACION_DOCUMENTAL",
          updatedAt: "2023-01-01T00:00:00Z"
        }
      ]);
    });
  });
});
