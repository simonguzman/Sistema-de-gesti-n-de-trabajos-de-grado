/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { LoadedDocumentsThesisWorkPageComponent } from './loaded-documents-thesis-work-page.component';

describe('LoadedDocumentsThesisWorkPageComponent', () => {
  let component: LoadedDocumentsThesisWorkPageComponent;
  let fixture: ComponentFixture<LoadedDocumentsThesisWorkPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LoadedDocumentsThesisWorkPageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LoadedDocumentsThesisWorkPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
