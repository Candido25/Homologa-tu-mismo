import type { CaseDetail, CaseSummary } from "./case-repository";

export type AdminCaseSummary = CaseSummary & {
  userId: string;
  userName: string | null;
  userEmail: string | null;
};

export type AdminCaseDetail = CaseDetail & {
  userName: string | null;
  userEmail: string | null;
};

export interface AdminCaseRepository {
  listAllCases(limit: number): Promise<AdminCaseSummary[]>;
  getById(caseId: string): Promise<AdminCaseDetail | null>;
}
