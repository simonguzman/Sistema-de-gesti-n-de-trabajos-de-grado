/* tslint:disable:no-unused-variable */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { UploadFinalDeliveryPageComponent } from './upload-final-delivery-page.component';

describe('UploadFinalDeliveryPageComponent', () => {
  let component: UploadFinalDeliveryPageComponent;
  let fixture: ComponentFixture<UploadFinalDeliveryPageComponent>;

  beforeEach((() => {
    TestBed.configureTestingModule({
      declarations: [ UploadFinalDeliveryPageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UploadFinalDeliveryPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
