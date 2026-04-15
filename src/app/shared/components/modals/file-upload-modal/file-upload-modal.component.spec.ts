/* tslint:disable:no-unused-variable */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement, input } from '@angular/core';

import { FileUploadModalComponent } from './file-upload-modal.component';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

describe('FileUploadModalComponent', () => {
  let component: FileUploadModalComponent;
  let fixture: ComponentFixture<FileUploadModalComponent>;

  beforeEach(async() => {
    TestBed.configureTestingModule({
      imports: [ FileUploadModalComponent ],
      providers: [ provideNoopAnimations() ]
    })
    .compileComponents();
    fixture = TestBed.createComponent(FileUploadModalComponent);
    component = fixture.componentInstance;
  });

  it('Debe mostrar la información cuando no se ha cargado un archivo', () => {
    component.description = 'Sube tu archivo';
    component.isOpen = true;
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Sube tu archivo');
  })

  it('Debe emitir un evento al seleccionar un archivo', () => {
     const spy = jest.spyOn(component.onFileUploaded, 'emit');
     const file = new File(['contenido'], 'test.pdf', { type: 'application/pdf'});
     const input = document.createElement('input');
     input.type = 'file';
     Object.defineProperty(input, 'files', {
      value: [file],
     });
     component.onFileSelected({ target: input } as unknown as Event);
     expect(component.uploadedFile).toBe(file);
     expect(spy).toHaveBeenCalledWith({
      fileName: 'test.pdf',
      file: file
     });
  });

  it('Debe mostrar la información del archivo cuando existe', () => {
    component.uploadedFile = new File(['contenido'], 'test.pdf');
    component.uploadedBy = 'Juan';
    component.isOpen = true;
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('test.pdf');
    expect(text).toContain('Juan')
  })

  it('removeFile debe limpiar el archivo', () => {
    component.uploadedFile = new File(['contenido'], 'test.pdf');
    component.removeFile();
    expect(component.uploadedFile).toBeNull();
  });

  it('closeModal debe limpiar el archivo y emitir onClose', () => {
    const spy = jest.spyOn(component.onClose, 'emit');
    component.uploadedFile = new File(['contenido'], 'test.pdf');
    component.closeModal();
    expect(component.uploadedFile).toBeNull();
    expect(spy).toHaveBeenCalled();
  })
});
