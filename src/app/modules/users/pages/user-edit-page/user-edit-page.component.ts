import { Component, inject, OnInit, signal } from '@angular/core';
import { UserFormComponent } from '../../components/user-form/user-form.component';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { NotificationService } from '../../../../shared/components/notifications/services/notification.service';
import { User } from '../../interfaces/user.interface';
import { NotificationType } from '../../../../shared/components/notifications/models/notification.model';
import { Location } from '@angular/common';
import { ConfirmationActionModalComponent } from '../../../../shared/components/modals/confirmation-action-modal/confirmation-action-modal.component';

@Component({
  selector: 'app-user-edit-page',
  imports: [ UserFormComponent, ConfirmationActionModalComponent ],
  templateUrl: './user-edit-page.component.html',
  styleUrls: ['./user-edit-page.component.css']
})
export class UserEditPageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private userService = inject(UserService);
  private notificationService = inject(NotificationService);
  private location = inject(Location);

  userToEdit = signal<User | null>(null);

  isConfirmModalOpen = false;
  private pendingUpdateData: User | null = null;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if(id){
      this.userService.getUserByIdMock(id).subscribe({
        next: (userFound) => {
          if(userFound) {
            this.userToEdit.set(userFound);
          } else {
            this.handleNotFound();
          }
        },
        error: () => this.handleNotFound('Error al conectar con el servidor')
      });
    } else {
      this.router.navigate(['/users']);
    }
  }

  handleUpdate(updatedData: User):void {
    this.pendingUpdateData = updatedData;
    this.isConfirmModalOpen = true;
  }

  confirmUpdate(): void {
    const id = this.userToEdit()?.id;
    if (!id || !this.pendingUpdateData) return;
    this.notificationService.show({
      title: 'Procesando actualización',
      message: 'Estamos procesando la actualización de la información del usuario...',
      type: NotificationType.INFO
    });

    this.userService.updateUserMock(id, this.pendingUpdateData).subscribe({
      next: () => {
        this.notificationService.show({
          title:'¡Actualización exitosa!',
          message: 'Los datos del usuario han sido modificados correctamente.',
          type: NotificationType.CONFIRMATION
        });
        this.router.navigate(['/users']);
      },
      error: () => {
        this.notificationService.show({
          title: 'Error de actualización',
          message: 'No se pudo guardar la información. Intente de nuevo',
          type: NotificationType.ERROR
        });
        this.isConfirmModalOpen = false;
      }
    });
  }

  cancelUpdate(): void {
    this.isConfirmModalOpen = false;
    this.pendingUpdateData = null;
  }

  private handleNotFound(message: string = 'Usuario no encontrado'): void {
    this.notificationService.show({
      title: 'Atención',
      message: message,
      type: NotificationType.ERROR
    });
    this.router.navigate(['/users']);
  }

  goBack (){
    this.location.back();
  }

}
