import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditAllUserComponent } from './edit-all-user.component';

describe('EditAllUserComponent', () => {
  let component: EditAllUserComponent;
  let fixture: ComponentFixture<EditAllUserComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditAllUserComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EditAllUserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
