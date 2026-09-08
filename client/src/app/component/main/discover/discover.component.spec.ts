import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DiscoverComponent } from './discover.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

describe('DiscoverComponent', () => {
  let component: DiscoverComponent;
  let fixture: ComponentFixture<DiscoverComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DiscoverComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DiscoverComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('filters by name/description and by tag', () => {
    component.allCommunities = [
      { _id: 'a', name: 'Chess Club', description: 'strategy', type: 'public', tags: [{ _id: 't1', name: 'Games' }] },
      { _id: 'b', name: 'Book Nook', description: 'reading', type: 'public', tags: [{ _id: 't2', name: 'Books' }] },
    ] as any;

    component.search = 'chess';
    component.applyFilter();
    expect(component.communities.map(c => c._id)).toEqual(['a']);

    component.search = 'reading';
    component.applyFilter();
    expect(component.communities.map(c => c._id)).toEqual(['b']);

    component.search = '';
    component.tagFilter = 't1';
    component.applyFilter();
    expect(component.communities.map(c => c._id)).toEqual(['a']);

    component.clearFilters();
    expect(component.communities.length).toBe(2);
    expect(component.hasActiveFilter).toBeFalse();
  });

  it('derives distinct sorted tag options', () => {
    component.allCommunities = [
      { _id: 'a', name: 'A', type: 'public', tags: [{ _id: 't2', name: 'Zeta' }] },
      { _id: 'b', name: 'B', type: 'public', tags: [{ _id: 't1', name: 'Alpha' }, { _id: 't2', name: 'Zeta' }] },
    ] as any;
    expect(component.tagOptions).toEqual([
      { _id: 't1', name: 'Alpha' },
      { _id: 't2', name: 'Zeta' },
    ]);
  });
});
