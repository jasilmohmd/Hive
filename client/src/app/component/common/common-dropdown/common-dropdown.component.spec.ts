import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonDropdownComponent } from './common-dropdown.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

describe('CommonDropdownComponent', () => {
  let component: CommonDropdownComponent;
  let fixture: ComponentFixture<CommonDropdownComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonDropdownComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CommonDropdownComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
