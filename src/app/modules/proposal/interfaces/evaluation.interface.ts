import { stateList } from "../../../shared/components/state/state.component";

export interface Evaluation {
  id: string;
  proposalId: string;
  evaluatorName: string;
  evaluatorRole: string;
  date: Date;
  veredict: stateList;
  observations: string;
  signedDocuments?: string[];
}
