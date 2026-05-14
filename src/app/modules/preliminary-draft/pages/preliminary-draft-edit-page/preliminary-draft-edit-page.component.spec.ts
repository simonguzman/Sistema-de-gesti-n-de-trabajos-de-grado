/* tslint:disable:no-unused-variable */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { PreliminaryDraftEditPageComponent } from './preliminary-draft-edit-page.component';

describe('PreliminaryDraftEditPageComponent', () => {
  let component: PreliminaryDraftEditPageComponent;
  let fixture: ComponentFixture<PreliminaryDraftEditPageComponent>;

  beforeEach((() => {
    TestBed.configureTestingModule({
      declarations: [ PreliminaryDraftEditPageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PreliminaryDraftEditPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
