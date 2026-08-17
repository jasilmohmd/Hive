import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonTableComponent } from './common-table.component';

describe('CommonTableComponent', () => {
  let component: CommonTableComponent;
  let fixture: ComponentFixture<CommonTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonTableComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CommonTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should accept friends appearance', () => {
    component.appearance = 'friends';
    component.data = [{ userName: 'a', profilePicture: '' }];
    component.columns = [{ header: 'Profile', field: 'profilePicture', isImage: true }];
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should hide thead when showColumnHeaders is false', () => {
    component.showColumnHeaders = false;
    component.data = [{ userName: 'x' }];
    component.columns = [{ header: 'Name', field: 'userName' }];
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('thead')).toBeNull();
  });

  it('should emit rowClick when enableRowClick and row body clicked', () => {
    const spy = jasmine.createSpy('rowClick');
    component.enableRowClick = true;
    component.rowClick.subscribe(spy);
    component.data = [{ userName: 'pat', _id: '1' }];
    component.columns = [
      { header: 'P', field: 'profilePicture', isImage: true },
      { header: 'U', field: 'userName' },
    ];
    fixture.detectChanges();
    const nameCell = fixture.nativeElement.querySelector('tbody td:nth-child(2)') as HTMLElement;
    nameCell?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(spy).toHaveBeenCalledWith(jasmine.objectContaining({ userName: 'pat', _id: '1' }));
  });
});
