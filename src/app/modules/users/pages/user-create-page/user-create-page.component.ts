import { Component, inject } from '@angular/core';
import { UserFormComponent } from '../../components/user-form/user-form.component';
import { Router } from '@angular/router';
import { User } from '../../interfaces/user.interface';
import { Location } from '@angular/common'

@Component({
  selector: 'app-user-create-page',
  imports: [UserFormComponent],
  templateUrl: './user-create-page.component.html',
  styleUrls: ['./user-create-page.component.css']
})
export class UserCreatePageComponent {
  private router = inject(Router);
  private location = inject(Location);
  handleCreateUser(userData : User){
    console.log('Enviando a la api: ', userData);
    this.router.navigate(['/usuarios']);
  }

  goBack (){
    this.location.back();
  }
}
