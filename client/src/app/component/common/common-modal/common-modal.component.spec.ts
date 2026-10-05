import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonModalComponent } from './common-modal.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

describe('CommonModalComponent', () => {
  let component: CommonModalComponent;
  let fixture: ComponentFixture<CommonModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonModalComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CommonModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('cancels on Escape pressed inside the panel', () => {
    // Regression: the panel's blanket stopPropagation used to swallow Escape
    // before the document-level listener could see it.
    const cancelled = jasmine.createSpy('cancelled');
    component.cancelled.subscribe(cancelled);
    const panel: HTMLElement = fixture.nativeElement.querySelector('[role="dialog"]');
    panel.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(cancelled).toHaveBeenCalledTimes(1);
  });

  it('keeps other keys from reaching the page underneath', () => {
    const onDoc = jasmine.createSpy('documentKeydown');
    document.addEventListener('keydown', onDoc);
    const panel: HTMLElement = fixture.nativeElement.querySelector('[role="dialog"]');
    panel.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    document.removeEventListener('keydown', onDoc);
    expect(onDoc).not.toHaveBeenCalled();
  });
});
