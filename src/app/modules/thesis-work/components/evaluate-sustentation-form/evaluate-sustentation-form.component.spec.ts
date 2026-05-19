/* tslint:disable:no-unused-variable */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { EvaluateSustentationFormComponent } from './evaluate-sustentation-form.component';

describe('EvaluateSustentationFormComponent', () => {
  let component: EvaluateSustentationFormComponent;
  let fixture: ComponentFixture<EvaluateSustentationFormComponent>;

  beforeEach((() => {
    TestBed.configureTestingModule({
      declarations: [ EvaluateSustentationFormComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EvaluateSustentationFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
