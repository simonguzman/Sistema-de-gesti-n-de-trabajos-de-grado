import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EmptyStateComponent } from './empty-state.component';

describe('EmptyStateComponent', () => {
  let component: EmptyStateComponent;
  let fixture: ComponentFixture<EmptyStateComponent>;

  beforeEach(async() => {
    TestBed.configureTestingModule({
      imports: [ EmptyStateComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmptyStateComponent);
    component = fixture.componentInstance;
  });

  it('Debe mostrarse el mensaje correcto', () => {
    component.message = 'No hay datos';
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No hay datos');
  });
});
