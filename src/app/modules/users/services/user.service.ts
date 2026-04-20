import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { User, UserState } from '../interfaces/user.interface';
import { delay, Observable, of, tap } from 'rxjs';
import { UserRoleType } from '../../../core/models/user-role';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);
  private apiUrl = 'https://api-sgtg-placeholder.com/api/users';
  private usersList = signal<User[]>([]);

  users = this.usersList.asReadonly();

  createUserMock(user: User): Observable<User> {
    const newUserWithId = {
      ...user,
      id: Math.random().toString(36).substr(2, 9) // Genera un ID temporal
    };
    return of(newUserWithId).pipe(
      delay(1000),
      tap(newUser => {
        this.usersList.update(currentUsers => [...currentUsers, newUser]);
      })
    );
  }
  createUser(user: User): Observable<User>{
    return this.http.post<User>(this.apiUrl, user);
  }

  /* Los métodos reales para cuando conectes el backend
    getUserById(id: string): Observable<User> {
      return this.http.get<User>(`${this.apiUrl}/${id}`);
    }

    updateUser(id: string, user: Partial<User>): Observable<User> {
      return this.http.put<User>(`${this.apiUrl}/${id}`, user);
    }
  */

  getUserByIdMock(id: string): Observable<User | undefined>{
    const user = this.usersList().find(currentUser => currentUser.id === id);
    return of(user).pipe(delay(500));
  }

  updateUserMock(id: string, changes: Partial<User>): Observable<User>{
    return of(changes as User).pipe(
      delay(1000),
      tap(() => {
        this.usersList.update(users =>
          users.map(user => user.id === id ? { ...user, ...changes }: user)
        );
      })
    );
  }

  softDeleteUserMock(id: string): Observable<void>{
    return of(undefined).pipe(
      delay(1000),
      tap(() => {
        this.usersList.update(users =>
          users.map(user =>
            user.id === id ? {...user, state: user.state === UserState.inactive ? UserState.active : UserState.inactive }: user
          )
        );
      })
    );
  }

  updateUserRolesMock(userId: string, newRoles: UserRoleType[]): Observable<void> {
  return of(undefined).pipe(
    delay(500),
    tap(() => {
      this.usersList.update(users =>
        users.map(user =>
          user.id === userId
            ? { ...user, roles: [...newRoles] }
            : user
          )
      );
    })
  );
}

}
