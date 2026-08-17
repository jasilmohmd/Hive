import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddfriendComponent } from './addfriend.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

describe('AddfriendComponent', () => {
  let component: AddfriendComponent;
  let fixture: ComponentFixture<AddfriendComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddfriendComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddfriendComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
