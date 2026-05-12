/* tslint:disable:no-unused-variable */

import { TestBed, inject } from '@angular/core/testing';
import { PreliminaryDraftService } from './preliminary-draft.service';

describe('Service: PreliminaryDraft', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PreliminaryDraftService]
    });
  });

  it('should ...', inject([PreliminaryDraftService], (service: PreliminaryDraftService) => {
    expect(service).toBeTruthy();
  }));
});
