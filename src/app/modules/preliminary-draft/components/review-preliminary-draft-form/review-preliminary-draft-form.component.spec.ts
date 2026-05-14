/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { ReviewPreliminaryDraftFormComponent } from './review-preliminary-draft-form.component';

describe('ReviewPreliminaryDraftFormComponent', () => {
  let component: ReviewPreliminaryDraftFormComponent;
  let fixture: ComponentFixture<ReviewPreliminaryDraftFormComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ReviewPreliminaryDraftFormComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReviewPreliminaryDraftFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
