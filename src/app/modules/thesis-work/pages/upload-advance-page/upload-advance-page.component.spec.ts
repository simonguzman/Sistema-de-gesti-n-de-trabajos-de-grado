/* tslint:disable:no-unused-variable */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { UploadAdvancePageComponent } from './upload-advance-page.component';

describe('UploadAdvacePageComponent', () => {
  let component: UploadAdvancePageComponent;
  let fixture: ComponentFixture<UploadAdvancePageComponent>;

  beforeEach((() => {
    TestBed.configureTestingModule({
      declarations: [ UploadAdvancePageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UploadAdvancePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
