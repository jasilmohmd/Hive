import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateCommunityLayoutComponent } from './layout.component';

describe('CreateCommunityLayoutComponent', () => {
  let component: CreateCommunityLayoutComponent;
  let fixture: ComponentFixture<CreateCommunityLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateCommunityLayoutComponent]
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
