/* tslint:disable:no-unused-variable */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { DownloadableFormatsPageComponent } from './downloadable-formats-page.component';

import { FileDownloadService } from '../../../../core/services/filedownload/file-download.service';
import { NotificationService } from '../../../../shared/components/notifications/services/notification.service';

import { NotificationType } from '../../../../shared/components/notifications/models/notification.model';

describe('DownloadableFormatsPageComponent', () => {
  let component: DownloadableFormatsPageComponent;
  let fixture: ComponentFixture<DownloadableFormatsPageComponent>;

  let mockRouter: any;
  let mockActivatedRoute: any;
  let mockDownloadService: any;
  let mockNotificationService: any;

  beforeEach(async () => {
    mockRouter = {
      navigate: jest.fn()
    };
    mockActivatedRoute = {};

    mockDownloadService = {
      download: jest.fn()
    };

    mockNotificationService = {
      show: jest.fn()
    };
    await TestBed.configureTestingModule({
      imports: [DownloadableFormatsPageComponent],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: FileDownloadService, useValue: mockDownloadService },
        { provide: NotificationService, useValue: mockNotificationService }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(
      DownloadableFormatsPageComponent
    );
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('Debe crear el componente', () => {
    expect(component).toBeTruthy();
  });

  it('Debe iniciar con la pestaña TI activa', () => {
    expect(component.activeTab()).toBe('TI');
  });

  it('Debe retornar formatos TI por defecto', () => {
    const formats = component.currentFormats();
    expect(formats.length).toBeGreaterThan(0);
    expect(formats[0].id).toContain('ti');
  });

  it('Debe cambiar formatos al cambiar pestaña a PP', () => {
    component.activeTab.set('PP');
    const formats = component.currentFormats();
    expect(formats.length).toBeGreaterThan(0);
    expect(formats[0].id).toContain('pp');
  });

  it('Debe retornar arreglo vacío si la pestaña no existe', () => {
    component.activeTab.set('INVALID');
    const formats = component.currentFormats();
    expect(formats).toEqual([]);
  });

  it('Debe descargar formato correctamente', () => {
    const row = {
      id: 'ti-a',
      title: 'Formato TI-A',
      url: '/assets/formatos/TI-A.pdf'
    };
    component.handleTableAction({
      action: 'descargar',
      row
    });
    expect(mockNotificationService.show)
      .toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Descarga en curso',
          type: NotificationType.INFO
        })
      );
    expect(mockDownloadService.download)
      .toHaveBeenCalledWith(
        row.url,
        'TI-A.pdf'
      );
  });
  it('Debe mostrar error si el archivo no tiene URL', () => {
    const row = {
      id: 'ti-a',
      title: 'Formato TI-A',
      url: ''
    };
    component.handleTableAction({
      action: 'descargar',
      row
    });
    expect(mockNotificationService.show)
      .toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Error de descarga',
          type: NotificationType.ERROR
        })
      );
    expect(mockDownloadService.download)
      .not.toHaveBeenCalled();
  });

  it('No debe hacer nada si la acción no es descargar', () => {
    const row = {
      id: 'ti-a',
      title: 'Formato TI-A',
      url: '/assets/formatos/TI-A.pdf'
    };
    component.handleTableAction({
      action: 'otro',
      row
    });
    expect(mockNotificationService.show)
      .not.toHaveBeenCalled();
    expect(mockDownloadService.download)
      .not.toHaveBeenCalled();
  });

  it('Debe navegar hacia atrás', () => {
    component.goBack();
    expect(mockRouter.navigate)
      .toHaveBeenCalledWith(
        ['../'],
        { relativeTo: mockActivatedRoute }
      );
  });
});
