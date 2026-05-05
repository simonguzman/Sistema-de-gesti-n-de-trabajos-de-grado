/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { ProposalService } from './proposal.service';

describe('Service: Proposal', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ProposalService]
    });
  });

  it('should ...', inject([ProposalService], (service: ProposalService) => {
    expect(service).toBeTruthy();
  }));
});
