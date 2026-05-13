import { stateList } from "../enums/state.enum";

export interface Evaluation {
  id: string;
  documentId: string;
  proposalId: string;
  evaluatorName: string;
  evaluatorRole: string;
  date: Date;
  veredict: stateList;
  observations: string;
  signedDocuments?: string[];
}
