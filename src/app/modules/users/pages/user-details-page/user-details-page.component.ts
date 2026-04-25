import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { User } from '../../interfaces/user.interface';
import { ButtonComponent } from '../../../../shared/components/button-component/button-component.component';

@Component({
  selector: 'app-user-details-page',
  imports: [CommonModule, ButtonComponent],
  templateUrl: './user-details-page.component.html',
  styleUrls: ['./user-details-page.component.css']
})
export class UserDetailsPageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private userService = inject(UserService);

  user = signal<User | undefined>(undefined);
  isLoading = signal(true);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if(id){
      this.userService.getUserByIdMock(id).subscribe(data => {
        this.user.set(data);
        this.isLoading.set(false);
      });
    } else {
      this.userService.getUserByIdMock('id-del-admin-logueado').subscribe(data => {
        this.user.set(data);
        this.isLoading.set(false);
      })
    }
  }

  goBack(){
    this.router.navigate(['/users']);
  }

}
