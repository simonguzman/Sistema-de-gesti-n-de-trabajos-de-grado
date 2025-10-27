import { Component, OnInit } from '@angular/core';
import { FooterComponent } from '../footer/footer.component';
import { RouterModule, Router, NavigationEnd } from "@angular/router";
import { HeaderComponent } from "../header/header.component";
import { SidebarComponent } from "../sidebar/sidebar.component";
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-main-layout',
  imports: [FooterComponent, RouterModule, HeaderComponent, SidebarComponent],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css',
})
export class MainLayoutComponent implements OnInit {
  currentPageName: string = 'Bandeja de entrada';

  private pageNames: { [key: string]: string } = {
    '/notifications': 'Bandeja de entrada',
    '/users': 'Usuarios',
    '/proposal': 'Propuesta',
    '/preliminary-draft': 'Anteproyecto',
    '/thesis-work': 'Trabajo de grado',
    '/statistics': 'Estadísticas'
  };

  constructor(private router: Router) {}

  ngOnInit() {
    this.updateCurrentPageName();

    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.updateCurrentPageName();
      });
  }

  private updateCurrentPageName() {
    const currentUrl = this.router.url;
    this.currentPageName = this.pageNames[currentUrl] || 'Bandeja de entrada';
  }
}
