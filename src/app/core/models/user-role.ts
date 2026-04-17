export enum UserRoleType {
  ADMINISTRADOR = 'Administrador',
  DIRECTOR = 'Director',
  ESTUDIANTE = 'Estudiante',
  CODIRECTOR = 'Codirector',
  ASESOR = 'Asesor',
  JEFE_DEP = 'Jefe de departamento',
  COMITE = 'Comité del programa',
  EVALUADOR = 'Evaluador',
  CONSEJO = 'Consejo de facultad',
  JURADO = 'Jurado'
}

export interface UserRole {
  type: UserRoleType;
  assigned: boolean;
}
