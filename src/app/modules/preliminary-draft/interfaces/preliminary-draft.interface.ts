import { stateList } from "../../../core/enums/state.enum";
import { Document } from "../../../core/interfaces/Document.inteface";
import { Evaluation } from "../../../core/interfaces/evaluation.interface";
import { Proposal } from "../../proposal/interfaces/proposal.interface";
import { User } from "../../users/interfaces/user.interface";

export interface PreliminaryDraft {
  preliminaryDraftId?: string;
  proposalId: string;
  proposalData: Proposal;
  preliminaryDraftDocument?: Document;
  signedProposal?: Document;
  councilResolution?: Document;
  reviewers?: User[];
  evaluations: Evaluation[];
  state: stateList;
  createdData:Date;
}
