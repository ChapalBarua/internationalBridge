import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BridgeCallComponent } from './bridge-call.component';

describe('BridgeCallComponent', () => {
  let component: BridgeCallComponent;
  let fixture: ComponentFixture<BridgeCallComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BridgeCallComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(BridgeCallComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
