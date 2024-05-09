import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TableMiddleComponent } from './table-middle.component';

describe('TableMiddleComponent', () => {
  let component: TableMiddleComponent;
  let fixture: ComponentFixture<TableMiddleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableMiddleComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TableMiddleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
