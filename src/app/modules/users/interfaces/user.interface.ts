import { UserRoleType } from "../../../core/models/user-role";
export enum IdentificationType {
  CC = 'cedula de ciudadania',
  CE = 'Cedula de extranjeria',
  PASSPORT = 'Pasaporte'
}

export enum UserState {
  active = 'Activo',
  inactive = 'Inactivo'
}

export interface User {
  id: string;
  idType: IdentificationType;
  idNumber: number;
  firstName: string;
  secondName?: string;
  lastName: string;
  secondLastName: string;
  codeNumber: number;
  roles: UserRoleType[];
  email: string;
  password: string;
  state: UserState
}
