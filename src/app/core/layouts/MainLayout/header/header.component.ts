import { Component, inject, ViewChild } from '@angular/core';
import { AvatarModule } from 'primeng/avatar'
import { MenuModule, Menu } from 'primeng/menu'
import { MenuItem } from 'primeng/api';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../modules/auth/services/auth.service';
import { Router } from '@angular/router';
import { ConfirmationActionModalComponent } from '../../../../shared/components/modals/confirmation-action-modal/confirmation-action-modal.component';

@Component({
  selector: 'app-header',
  imports: [CommonModule, AvatarModule, MenuModule, ConfirmationActionModalComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent {
   private authService = inject(AuthService);
   private router = inject(Router);
  @ViewChild('menu') menu!: Menu;
  isMenuOpen = false;
  isLogoutModal = false;

  userName = 'Admin';
  userRole = 'Administrador';
  userAvatar = 'assets/images/avatar-default.png';

  menuItems: MenuItem[] = [
  {
    label: 'Mi Perfil',
    icon: 'pi pi-user',
    command: () => this.goToProfile()
  },
  { separator: true },
  {
    label: 'Cerrar Sesión',
    icon: 'pi pi-sign-out',
    command: () => this.openLogoutModal()
  }
];

  onMenuToggle(event: Event) {
    this.isMenuOpen = !this.isMenuOpen;
    this.menu.toggle(event);
  }

  goToProfile() {
    // Navegar a perfil
  }

  goToSettings() {
    // Navegar a configuración
  }
  closeMenu() {
    this.isMenuOpen = false;
  }

  openLogoutModal() {
    this.isLogoutModal = true;
  }

  cancelLogout() {
    this.isLogoutModal = false;
  }

  confirmLogout(){
    this.isLogoutModal = false;
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}
