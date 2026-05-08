export enum UserRoleType {
  ADMINISTRADOR = 'Administrador',
  DOCENTE = 'Docente',
  ESTUDIANTE = 'Estudiante',
  DIRECTOR = 'Director',
  CODIRECTOR = 'Codirector',
  ASESOR = 'Asesor',
  JEFE_DEP = 'Jefe de departamento',
  COMITE = 'Comité del programa',
  EVALUADOR = 'Evaluador',
  CONSEJO = 'Consejo de facultad',
  JURADO = 'Jurado',
  DECANATURA = 'Decanatura'
}

export interface UserRole {
  type: UserRoleType;
  assigned: boolean;
}
