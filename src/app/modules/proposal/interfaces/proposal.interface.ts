import { stateList } from "../../../shared/components/state/state.component";
import { Evaluation } from "./evaluation.interface";
import { ProposalDocument } from "./proposalDocument.inteface";

export enum Modality{
  TI = 'Trabajo de investigación',
  PP = 'Practica profesional'
}

export interface Proposal {
  id?: string;
  title: string;
  description: string;
  modality: Modality;
  lineOfResearch?: string;
  authors: string[];
  directorId: string;
  codirector?: string;
  state: stateList;
  createdAt: Date;
  documents: ProposalDocument[];
  evaluations: Evaluation[];
}
