import { Component, ViewChild } from '@angular/core';
import { AvatarModule } from 'primeng/avatar'
import { MenuModule, Menu } from 'primeng/menu'
import { MenuItem } from 'primeng/api';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  imports: [CommonModule, AvatarModule, MenuModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent {
   //private authService = inject(AuthService);

  @ViewChild('menu') menu!: Menu;
  isMenuOpen = false;

  userName = 'Admin';
  userRole = 'Administrador';
  userAvatar = 'assets/images/avatar-default.png';

  menuItems: MenuItem[] = [
    {
      label: 'Mi Perfil',
      icon: 'pi pi-user',
      command: () => this.goToProfile()
    },
    {
      label: 'Configuración',
      icon: 'pi pi-cog',
      command: () => this.goToSettings()
    },
    {
      separator: true
    },
    /*{
      label: 'Cerrar Sesión',
      icon: 'pi pi-sign-out',
      command: () => this.logout()
    }*/
  ];

  goToProfile() {
    // Navegar a perfil
  }

  goToSettings() {
    // Navegar a configuración
  }

  toggleMenu(event: Event) {
    this.isMenuOpen = !this.isMenuOpen;
    this.menu.toggle(event);
  }

  /*logout() {
    this.authService.logout();
  }*/
}
