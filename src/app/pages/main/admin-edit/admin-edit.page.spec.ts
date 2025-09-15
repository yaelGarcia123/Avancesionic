import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminEditPage } from './admin-edit.page';

describe('AdminEditPage', () => {
  let component: AdminEditPage;
  let fixture: ComponentFixture<AdminEditPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminEditPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
