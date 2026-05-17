import { Component, inject, OnInit, signal } from '@angular/core';
import { ThesisWorkService } from '../../services/thesis-work.service';
import { UserService } from '../../../users/services/user.service';
import { NotificationService } from '../../../../shared/components/notifications/services/notification.service';
import { ActivatedRoute, Router } from '@angular/router';
import { User } from '../../../users/interfaces/user.interface';
import { UserRoleType } from '../../../../core/models/user-role';
import { NotificationType } from '../../../../shared/components/notifications/models/notification.model';
import { ConfirmationActionModalComponent } from "../../../../shared/components/modals/confirmation-action-modal/confirmation-action-modal.component";
import { RegisterSustentationFormComponent } from "../../components/register-sustentation-form/register-sustentation-form.component";

@Component({
  selector: 'app-register-sustentation-page',
  templateUrl: './register-sustentation-page.component.html',
  styleUrls: ['./register-sustentation-page.component.css'],
  imports: [ConfirmationActionModalComponent, RegisterSustentationFormComponent]
})
export class RegisterSustentationPageComponent implements OnInit {
  private readonly thesisWorkService = inject(ThesisWorkService);
  private readonly userService = inject(UserService);
  private readonly notification = inject(NotificationService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  thesisWorkState = signal<any | null>(null);
  teachersState = signal<User[]>([]);

  isConfirmModalOpen = signal(false);
  isSubmitting = signal(false);

  pendingData = signal<{ payload: any, file: File } | null>(null);

  ngOnInit() {
    // 🔍 Extraer ID de la ruta de manera segura y recursiva
    let currentRoute: ActivatedRoute | null = this.route;
    let id: string | null = null;
    while (currentRoute && !id) {
      id = currentRoute.snapshot.paramMap.get('id');
      currentRoute = currentRoute.parent;
    }

    if (id) {
      this.loadData(id);
    } else {
      this.notification.show({ title: 'Error', message: 'No se identificó el ID del Trabajo de Grado.', type: NotificationType.ERROR });
      this.goBack();
    }
  }

  private loadData(id: string) {
    // 1. Cargar el Trabajo de Grado
    this.thesisWorkService.getThesisWorkByIdMock(id).subscribe({
      next: (data) => {
        if (data) this.thesisWorkState.set(data);
      }
    });

    // 2. Cargar los docentes para la búsqueda predictiva
    this.userService.getUsersByRole(UserRoleType.DOCENTE).subscribe({
      next: (teachers) => {
        if (teachers) this.teachersState.set(teachers);
      }
    });
  }

  handleRequestConfirmation(data: { payload: any, file: File }) {
    this.pendingData.set(data);
    this.isConfirmModalOpen.set(true);
  }

  processSustentacion() {
    const data = this.pendingData();
    const thesisId = this.thesisWorkState()?.thesisWorkId;

    if (!data || !thesisId) return;

    this.isSubmitting.set(true);
    this.isConfirmModalOpen.set(false);

    // Guardar mediante el servicio mock unificado
    this.thesisWorkService.saveSustentationRegistryMock(thesisId, data.payload).subscribe({
      next: () => {
        this.notification.show({
          title: 'Sustentación Agendada',
          message: 'Se han asignado los jurados y la programación oficial correctamente.',
          type: NotificationType.CONFIRMATION
        });
        this.isSubmitting.set(false);
        this.goBack();
      },
      error: () => {
        this.notification.show({ title: 'Error', message: 'Fallo al procesar el agendamiento.', type: NotificationType.ERROR });
        this.isSubmitting.set(false);
      }
    });
  }

  goBack() {
    this.router.navigate(['../'], { relativeTo: this.route });
  }
}
