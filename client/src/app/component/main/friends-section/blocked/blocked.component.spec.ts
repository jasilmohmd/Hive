import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BlockedComponent } from './blocked.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

describe('BlockedComponent', () => {
  let component: BlockedComponent;
  let fixture: ComponentFixture<BlockedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BlockedComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BlockedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
