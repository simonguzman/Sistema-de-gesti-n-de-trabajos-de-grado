import { stateList } from "../enums/state.enum";

export interface Document {
  id: string;
  name: string;
  url: string;
  uploadDate: string | Date;
  type: 'Propuesta' | 'Anteproyecto' | 'Anexo' | 'Correccion' | 'Formato' | 'Resolucion'
  status?: stateList;
}
