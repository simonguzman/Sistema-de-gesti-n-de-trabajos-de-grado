export interface ProposalDocument {
  id: string;
  name: string;
  url: string;
  uploadDate: Date;
  type: 'Propuesta' | 'Anexo' | 'Correccion' | 'Formato'
}
