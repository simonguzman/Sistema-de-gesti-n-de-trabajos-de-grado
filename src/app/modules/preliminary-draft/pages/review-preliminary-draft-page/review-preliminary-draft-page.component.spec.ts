/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { ReviewPreliminaryDraftPageComponent } from './review-preliminary-draft-page.component';

describe('ReviewPreliminaryDraftPageComponent', () => {
  let component: ReviewPreliminaryDraftPageComponent;
  let fixture: ComponentFixture<ReviewPreliminaryDraftPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ReviewPreliminaryDraftPageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReviewPreliminaryDraftPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
