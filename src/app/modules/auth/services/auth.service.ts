import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, delay, Observable, of, tap } from 'rxjs';

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

}
