/* tslint:disable:no-unused-variable */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';
import { UploadAdvanceFormComponent } from './upload-advance-form.component';


describe('UploadAdvaceFormComponent', () => {
  let component: UploadAdvanceFormComponent;
  let fixture: ComponentFixture<UploadAdvanceFormComponent>;

  beforeEach((() => {
    TestBed.configureTestingModule({
      declarations: [ UploadAdvanceFormComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UploadAdvanceFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
