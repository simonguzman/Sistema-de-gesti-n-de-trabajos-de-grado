/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { BreadcrumbService } from './Breadcrumb.service';

describe('Service: Breadcrumb', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [BreadcrumbService]
    });
  });

  it('should ...', inject([BreadcrumbService], (service: BreadcrumbService) => {
    expect(service).toBeTruthy();
  }));
});
