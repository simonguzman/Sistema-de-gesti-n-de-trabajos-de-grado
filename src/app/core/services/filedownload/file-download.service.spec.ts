/* tslint:disable:no-unused-variable */

import { TestBed, inject } from '@angular/core/testing';
import { FileDownloadService } from './file-download.service';

describe('Service: FileDownload', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FileDownloadService]
    });
  });

  it('should ...', inject([FileDownloadService], (service: FileDownloadService) => {
    expect(service).toBeTruthy();
  }));
});
