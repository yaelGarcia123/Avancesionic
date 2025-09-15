import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminAddHousePagePage } from './admin-add-house.page.page';

describe('AdminAddHousePagePage', () => {
  let component: AdminAddHousePagePage;
  let fixture: ComponentFixture<AdminAddHousePagePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminAddHousePagePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
