import { TestBed } from '@angular/core/testing';

import { ProgressService } from './progress.service';

describe('ProgressServiceService', () => {
  let service: ProgressService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProgressService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
