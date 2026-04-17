import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { User } from '../interfaces/user.interface';
import { delay, Observable, of, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);
  private apiUrl = 'https://api-sgtg-placeholder.com/api/users';
  private usersList = signal<User[]>([]);

  users = this.usersList.asReadonly();

  createUserMock(user: User): Observable<User> {
    return of(user).pipe(
      delay(1000),
      tap(newUser => {
        this.usersList.update(currentUsers => [...currentUsers, newUser]);
      })
    );
  }

  createUser(user: User): Observable<User>{
    return this.http.post<User>(this.apiUrl, user);
  }

  getUsers(): User[] {
    return this.users();
  }

}
