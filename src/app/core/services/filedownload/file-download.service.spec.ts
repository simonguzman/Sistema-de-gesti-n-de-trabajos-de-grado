/* tslint:disable:no-unused-variable */

import { TestBed } from '@angular/core/testing';
import { FileDownloadService } from './file-download.service';
import { HttpTestingController, HttpClientTestingModule } from '@angular/common/http/testing';

describe('Service: FileDownload', () => {
  let service: FileDownloadService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [FileDownloadService]
    });
    service = TestBed.inject(FileDownloadService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify(); // Asegura que no queden peticiones pendientes
    jest.restoreAllMocks(); // Limpia los espías de window
  });

  it('Debe ser creado', () => {
    expect(service).toBeTruthy();
  });

  it('Debe usar descarga directa cuando useBlob es false', () => {
    // Espiamos el método privado (usando casting a any para acceder)
    const spy = jest.spyOn(service as any, 'directDownload');

    service.download('http://test.com/file.pdf', 'test.pdf', false);

    expect(spy).toHaveBeenCalledWith('http://test.com/file.pdf', 'test.pdf');
  });

  it('Debe descargar como Blob, crear ObjectURL y luego limpiar cuando useBlob es true', async () => {
    const mockUrl = 'http://test.com/file.pdf';
    const mockFileName = 'test.pdf';
    const mockBlob = new Blob(['contenido'], { type: 'application/pdf' });
    const mockObjectUrl = 'blob:http://localhost:1234/uuid';

    // 1. Definimos las funciones en window.URL si no existen en JSDOM
    if (typeof window.URL.createObjectURL === 'undefined') {
      window.URL.createObjectURL = jest.fn();
      window.URL.revokeObjectURL = jest.fn();
    }

    // 2. Ahora sí podemos espiarlas y mockear su retorno
    const createSpy = jest.spyOn(window.URL, 'createObjectURL').mockReturnValue(mockObjectUrl);
    const revokeSpy = jest.spyOn(window.URL, 'revokeObjectURL').mockImplementation(() => {});
    const directSpy = jest.spyOn(service as any, 'directDownload');

    // Iniciamos la descarga
    const downloadPromise = service.download(mockUrl, mockFileName, true);

    // Respondemos a la petición HTTP
    const req = httpMock.expectOne(mockUrl);
    expect(req.request.method).toBe('GET');
    req.flush(mockBlob);

    await downloadPromise;

    expect(createSpy).toHaveBeenCalledWith(mockBlob);
    expect(directSpy).toHaveBeenCalledWith(mockObjectUrl, mockFileName);
    expect(revokeSpy).toHaveBeenCalledWith(mockObjectUrl);
  });

  it('Debe manejar errores de red al descargar el Blob', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const mockUrl = 'http://test.com/fail.pdf';

    const downloadPromise = service.download(mockUrl, 'fail.pdf', true);

    const req = httpMock.expectOne(mockUrl);
    req.error(new ErrorEvent('Network error'));

    await downloadPromise;

    expect(consoleSpy).toHaveBeenCalledWith('Error al descargar el archivo:', expect.any(Object));
  });

  it('Debe manipular el DOM correctamente en directDownload', () => {
    // Espiamos document.createElement para ver si crea el link
    const linkMock = {
      href: '',
      download: '',
      target: '',
      click: jest.fn(),
      remove: jest.fn()
    } as any;

    jest.spyOn(document, 'createElement').mockReturnValue(linkMock);

    // Llamamos al método privado
    (service as any).directDownload('http://test.url', 'file.txt');

    expect(linkMock.href).toBe('http://test.url');
    expect(linkMock.download).toBe('file.txt');
    expect(linkMock.target).toBe('_blank');
    expect(linkMock.click).toHaveBeenCalled();
    expect(linkMock.remove).toHaveBeenCalled();
  });
});
