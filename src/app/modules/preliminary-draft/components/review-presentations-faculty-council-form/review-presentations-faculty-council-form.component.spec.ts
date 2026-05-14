/* tslint:disable:no-unused-variable */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { ReviewPresentationsFacultyCouncilFormComponent } from './review-presentations-faculty-council-form.component';

describe('ReviewPresentationsFacultyCouncilFormComponent', () => {
  let component: ReviewPresentationsFacultyCouncilFormComponent;
  let fixture: ComponentFixture<ReviewPresentationsFacultyCouncilFormComponent>;

  beforeEach((() => {
    TestBed.configureTestingModule({
      declarations: [ ReviewPresentationsFacultyCouncilFormComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReviewPresentationsFacultyCouncilFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
