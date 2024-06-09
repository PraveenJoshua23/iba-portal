import { TestBed } from '@angular/core/testing';

import { LessonsServiceService } from './lessons-service.service';

describe('LessonsServiceService', () => {
  let service: LessonsServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LessonsServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
