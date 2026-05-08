import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { User } from '../../interfaces/user.interface';
import { ButtonComponent } from '../../../../shared/components/button-component/button-component.component';
import { AuthService } from '../../../../core/services/auth/auth.service';

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
  private authService = inject(AuthService); // Inyectamos el nuevo servicio

  user = signal<User | undefined>(undefined);
  isLoading = signal(true);
  isMyProfile = signal(false); // Para saber si estamos viendo "Mi Perfil"

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      // Caso 1: Viendo detalles de un usuario específico por ID
      this.isMyProfile.set(false);
      this.userService.getUserByIdMock(id).subscribe(data => {
        this.user.set(data);
        this.isLoading.set(false);
      });
    } else {
      // Caso 2: Ruta /profile (Sin ID). Tomamos el usuario logueado
      this.isMyProfile.set(true);
      const currentUser = this.authService.currentUser();

      if (currentUser) {
        this.user.set(currentUser);
      }
      this.isLoading.set(false);
    }
  }

  goBack() {
    // Si es mi perfil, quizás prefieras ir al dashboard o notificaciones
    if (this.isMyProfile()) {
      this.router.navigate(['/notifications']);
    } else {
      this.router.navigate(['/users']);
    }
  }

}
