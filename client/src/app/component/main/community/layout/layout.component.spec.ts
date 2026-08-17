import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComunityLayoutComponent } from './layout.component';

describe('ComunityLayoutComponent', () => {
  let component: ComunityLayoutComponent;
  let fixture: ComponentFixture<ComunityLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComunityLayoutComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ComunityLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
