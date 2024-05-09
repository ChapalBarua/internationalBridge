import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BridgeTableComponent } from './bridge-table.component';

describe('BridgeTableComponent', () => {
  let component: BridgeTableComponent;
  let fixture: ComponentFixture<BridgeTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BridgeTableComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(BridgeTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
