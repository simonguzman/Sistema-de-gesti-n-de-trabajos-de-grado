import { Component, OnInit } from '@angular/core';
import { FooterComponent } from '../footer/footer.component';
import { RouterModule, Router, NavigationEnd, ActivatedRoute } from "@angular/router";
import { HeaderComponent } from "../header/header.component";
import { SidebarComponent } from "../sidebar/sidebar.component";
import { filter, map } from 'rxjs/operators';

@Component({
  selector: 'app-main-layout',
  imports: [FooterComponent, RouterModule, HeaderComponent, SidebarComponent],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css',
})
export class MainLayoutComponent implements OnInit {

  currentPageTitle: string = '';
  currentPageBreadcrumb: string = '';

  constructor(private router: Router, private activatedRoute: ActivatedRoute) {}

  ngOnInit() {
    this.router.events
      .pipe(
          filter(event => event instanceof NavigationEnd),
          map(() => {
            let route = this.activatedRoute;
            while(route.firstChild) route = route.firstChild;
            return {
               title: route.snapshot.title ?? 'Inicio',
               breadcrumb: route.snapshot.data['breadcrumb'] ?? 'Inicio'
            }
          })
        )
      .subscribe(({title, breadcrumb}) => {
        this.currentPageTitle = title;
        this.currentPageBreadcrumb = breadcrumb;
      });
  }
}
