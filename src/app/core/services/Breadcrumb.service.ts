import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, NavigationEnd, Router } from '@angular/router';
import { BehaviorSubject, filter } from 'rxjs';

@Injectable({
  providedIn: 'root' // Esto asegura que sea un singleton en toda la app
})
export class BreadcrumbService {
  // Usamos BehaviorSubject para que cualquier componente pueda suscribirse al estado actual
  private readonly _breadcrumbs$ = new BehaviorSubject<Array<{ label: string, url: string }>>([]);
  readonly breadcrumbs$ = this._breadcrumbs$.asObservable();

  constructor(private router: Router) {
    // Nos suscribimos a cada final de navegación exitosa
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd)
    ).subscribe(() => {
      const root = this.router.routerState.snapshot.root;
      const breadcrumbs: Array<{ label: string, url: string }> = [{ label: 'Inicio', url: '/' }];
      this.addBreadcrumb(root, [], breadcrumbs);
      this._breadcrumbs$.next(breadcrumbs);
    });
  }

  private addBreadcrumb(route: ActivatedRouteSnapshot, parentUrl: string[], breadcrumbs: any[]) {
    if (route) {
      // Construimos la URL acumulada
      const routeUrl = parentUrl.concat(route.url.map(url => url.path));

      // Si la ruta tiene la propiedad breadcrumb, la agregamos al array
      if (route.data['breadcrumb']) {
        breadcrumbs.push({
          label: route.data['breadcrumb'],
          url: '/' + routeUrl.join('/')
        });
      }

      // Seguimos bajando recursivamente por el árbol de rutas hijas
      if (route.firstChild) {
        this.addBreadcrumb(route.firstChild, routeUrl, breadcrumbs);
      }
    }
  }
}
