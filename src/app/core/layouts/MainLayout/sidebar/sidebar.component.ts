import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MenuModule } from 'primeng/menu';
import { MenuItem } from 'primeng/api';

interface MenuItemCustom extends MenuItem {
  routerLink?: string;
  isActive?: boolean;
}

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule, RouterModule, MenuModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
})
export class SidebarComponent {
  menuItems: MenuItemCustom[] = [
    {
      label: 'Bandeja de entrada',
      routerLink: '/notifications',
      icon: 'pi pi-check-circle'
    },
    {
      label: 'Usuarios',
      routerLink: '/users',
      icon: 'pi pi-check-circle'
    },
    {
      label: 'Propuesta',
      routerLink: '/proposal',
      icon: 'pi pi-check-circle'
    },
    {
      label: 'Anteproyecto',
      routerLink: '/preliminary-draft',
      icon: 'pi pi-check-circle'
    },
    {
      label: 'Trabajo de grado',
      routerLink: '/thesis-work',
      icon: 'pi pi-check-circle'
    },
    {
      label: 'Estadísticas',
      routerLink: '/statistics',
      icon: 'pi pi-check-circle'
    }
  ];
 }
