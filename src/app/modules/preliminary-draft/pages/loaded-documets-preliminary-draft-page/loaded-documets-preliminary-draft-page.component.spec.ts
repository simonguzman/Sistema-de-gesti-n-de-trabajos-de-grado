/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { LoadedDocumetsPreliminaryDraftPageComponent } from './loaded-documets-preliminary-draft-page.component';

describe('LoadedDocumetsPreliminaryDraftPageComponent', () => {
  let component: LoadedDocumetsPreliminaryDraftPageComponent;
  let fixture: ComponentFixture<LoadedDocumetsPreliminaryDraftPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LoadedDocumetsPreliminaryDraftPageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LoadedDocumetsPreliminaryDraftPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
