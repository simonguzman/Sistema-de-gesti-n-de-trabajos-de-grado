import { stateList } from "../../../core/enums/state.enum";
import { Document } from "../../../core/interfaces/Document.interface";
import { Evaluation } from "../../../core/interfaces/evaluation.interface";
import { PreliminaryDraft } from "../../preliminary-draft/interfaces/preliminary-draft.interface";
import { User } from "../../users/interfaces/user.interface";

export interface JurorVerdict {
  jurorId: string;
  evaluationDate: Date;
  veredict: stateList.APROBADO | stateList.APROBADO_CON_OBSERVACIONES | stateList.NO_APROBADO | stateList.APLAZADO;
  observations: string;
}

export interface SustentationRegistry {
  id: string;
  sustentationDate?: Date;
  sustentationTime?: string;
  assignedJurors: User[];
  verdicts: JurorVerdict[]; // Soporta múltiples votos/actas de jurados de forma dinámica
}

export interface SpecialRequest {
  id: string;
  directorId: string;
  requestDate: Date;
  description: string;
  status: stateList.EN_REVISION | stateList.APROBADO | stateList.NO_APROBADO;
  resolutionDetails?: string;
}

export interface ThesisWork {
  thesisWorkId: string;
  preliminaryDraftId: string;
  preliminaryDraftData: PreliminaryDraft; // Mantiene la trazabilidad inicial

  // CENTRALIZACIÓN: Todos los archivos (avances, Formato E, F, G, H) viven aquí
  documents: Document[];

  // TRAZABILIDAD: Evaluaciones de avances, dictámenes de asesores (Formato D) o paz y salvos (Formato F)
  evaluations: Evaluation[];

  // PROCESO OPERATIVO: Estructura activa para coordinar la defensa final
  sustentation?: SustentationRegistry;

  // SOLICITUDES: Peticiones excepcionales del estudiante/director
  specialRequests: SpecialRequest[];

  state: stateList;
  createdDate: Date;
}
