import { stateList } from "../enums/state.enum";

export enum DocumentType{
  'PROPUESTA' = 'Propuesta',
  'ANTEPROYECTO' = 'Anteproyecto',
  'ANEXO' = 'Anexo',
  'CORRECCION' = 'Correccion',
  'FORMATO' = 'Formato',
  'RESOLUCION' = 'Resolucion'
}

export interface Document {
  id: string;
  name: string;
  url: string;
  uploadDate: string | Date;
  type: DocumentType
  status?: stateList;
}
