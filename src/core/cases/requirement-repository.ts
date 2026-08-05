export type RequirementStatus =
  | "missing"
  | "uploaded"
  | "processing"
  | "approved"
  | "needs_action"
  | "not_applicable";

export type CaseRequirement = {
  id: string;
  caseId: string;
  documentTypeCode: string;
  required: boolean;
  status: RequirementStatus;
  reason: string | null;
  dueDate: string | null;
  updatedAt: string;
};

export interface RequirementRepository {
  listByCaseForUser(caseId: string, userId: string): Promise<CaseRequirement[]>;
  updateStatus(caseId: string, userId: string, documentTypeCode: string, status: RequirementStatus): Promise<void>;
}
