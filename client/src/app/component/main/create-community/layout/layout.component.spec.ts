import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateCommunityLayoutComponent } from './layout.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

describe('CreateCommunityLayoutComponent', () => {
  let component: CreateCommunityLayoutComponent;
  let fixture: ComponentFixture<CreateCommunityLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateCommunityLayoutComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateCommunityLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
