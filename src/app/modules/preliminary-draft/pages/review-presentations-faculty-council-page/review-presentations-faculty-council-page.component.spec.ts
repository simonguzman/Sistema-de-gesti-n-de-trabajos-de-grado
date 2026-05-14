/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { ReviewPresentationsFacultyCouncilPageComponent } from './review-presentations-faculty-council-page.component';

describe('ReviewPresentationsFacultyCouncilPageComponent', () => {
  let component: ReviewPresentationsFacultyCouncilPageComponent;
  let fixture: ComponentFixture<ReviewPresentationsFacultyCouncilPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ReviewPresentationsFacultyCouncilPageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReviewPresentationsFacultyCouncilPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
