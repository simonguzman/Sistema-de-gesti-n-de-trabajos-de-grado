import { Component, inject } from '@angular/core';
import { UserFormComponent } from '../../components/user-form/user-form.component';
import { Router } from '@angular/router';
import { User } from '../../interfaces/user.interface';
import { Location } from '@angular/common'
import { UserService } from '../../services/user.service';
import { NotificationService } from '../../../../shared/components/notifications/services/notification.service';
import { NotificationType } from '../../../../shared/components/notifications/models/notification.model';
import { ConfirmationActionModalComponent } from '../../../../shared/components/modals/confirmation-action-modal/confirmation-action-modal.component';

@Component({
  selector: 'app-user-create-page',
  imports: [UserFormComponent, ConfirmationActionModalComponent],
  templateUrl: './user-create-page.component.html',
  styleUrls: ['./user-create-page.component.css']
})
export class UserCreatePageComponent {
  private userService = inject(UserService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private location = inject(Location);

  isConfirmModalOpen = false;
  pendingUserData: User | null = null;
  handleCreateUser(userData : User){
    this.pendingUserData = userData;
    this.isConfirmModalOpen = true;
  }

  cancelCreation() {
    this.isConfirmModalOpen = false;
    this.pendingUserData = null;
  }

  confirmCreation(){
    if(!this.pendingUserData) return;
    this.isConfirmModalOpen = false;
    this.showInfoNotification();
    this.userService.createUserMock(this.pendingUserData).subscribe({
      next: (response) => {
        this.pendingUserData = null;
        this.showConfirmationNotification();
        this.router.navigate(['/users'])
      },
      error: (err) => {
        console.log('Error en la creación ',err)
        this.showErrorNotification();
      }
    });
  }

  private showInfoNotification() {
    this.notificationService.show({
      title: 'Procesando registro',
      message: 'Estamos procesando la información del usuario...',
      type: NotificationType.INFO
    });
  }

  private showConfirmationNotification() {
    this.notificationService.show({
      title: 'Usuario registrado',
      message: 'El usuario ha sido registrado correctamente.',
      type: NotificationType.CONFIRMATION,
    });
  }

  private showErrorNotification() {
    this.notificationService.show({
      title: 'Error de servidor',
      message: 'No se pudo guardar el usuario. Intente nuevamente.',
      type: NotificationType.ERROR,
    });
  }

  goBack (){
    this.location.back();
  }
}
