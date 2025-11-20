import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ManagerTicketsPage } from './manager-tickets.page';

describe('ManagerTicketsPage', () => {
  let component: ManagerTicketsPage;
  let fixture: ComponentFixture<ManagerTicketsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ManagerTicketsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
