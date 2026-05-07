export interface ProposalDocument {
  id: string;
  name: string;
  url: string;
  uploadDate: string | Date;
  type: 'Propuesta' | 'Anexo' | 'Correccion' | 'Formato'
  status?: string;
}
