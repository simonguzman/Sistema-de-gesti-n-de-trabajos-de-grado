import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, delay, Observable, of, tap } from 'rxjs';

export interface ChangePasswordResponse {
  success: boolean;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private loggedIn = new BehaviorSubject<boolean>(this.hasToken());

  constructor() { }

  login(credentials: any): Observable<any> {
    // Simulamos que el backend valida los datos
    const mockResponse = {
      token: 'fake-jwt-token-12345',
      user: { email: credentials.email, role: 'estudiante' }
    };
    return of(mockResponse).pipe(
      delay(1000),
      tap(response => {
        localStorage.setItem('auth_token', response.token);
        this.loggedIn.next(true);
      })
    );
  }

  logout(): void {
    localStorage.removeItem('auth_token');
    this.loggedIn.next(false);
  }

  private hasToken(): boolean {
    return !!localStorage.getItem('auth_token');
  }

  isLoggedIn(): Observable<boolean> {
    return this.loggedIn.asObservable();
  }

  /**
   * Realiza el cambio de contraseña del usuario.
   * @param currentPassword Contraseña anterior para validación.
   * @param newPassword Nueva contraseña elegida.
   */
  changePassword(currentPassword: string, newPassword: string): Observable<ChangePasswordResponse> {
    // 1. Estructura de la petición que esperará el backend
    const payload = {
      currentPassword,
      newPassword
    };

    /**
     * MODO SIMULACIÓN (Actual):
     * Retornamos un observable exitoso con un retraso para probar los estados "Loading".
     */
    return of({
      success: true,
      message: 'La contraseña ha sido actualizada correctamente en el sistema.'
    }).pipe(
      delay(1500), // Simula latencia de red
      tap(() => console.log('Petición de cambio de contraseña exitosa simulada'))
    );

    /**
     * MODO REAL (Descomentar cuando el backend esté listo):
     * return this.http.patch<ChangePasswordResponse>(`${this.API_URL}/change-password`, payload);
     */
  }

}
