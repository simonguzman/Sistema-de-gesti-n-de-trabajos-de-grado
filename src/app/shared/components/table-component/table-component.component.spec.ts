import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Column, TableComponent } from './table-component.component';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';

const COLUMNS_TEXT: Column[] = [
  { field: 'nombre', header: 'Nombre', type: 'text', width: '50%' },
  { field: 'correo', header: 'Correo', type: 'text', width: '50%' },
];

const COLUMS_STATE: Column[] = [
  { field: 'nombre', header: 'Nombre', type: 'text' },
  { field: 'estado', header: 'Estado', type: 'state' },
];

const COLUMNS_ACTIONS: Column[] = [
  { field: 'nombre', header: 'Nombre', type: 'text' },
  {
    field: 'acciones',
    header: 'Acciones',
    type: 'actions',
    actions: [
      { action: 'ver', icon: 'visibility', variant: 'primary' },
      { action: 'eliminar', icon: 'delete', variant: 'primary'},
    ],
  },
];

const ROWS = [
  { nombre: 'Simón Guzmán', correo: 'simonguzman@unicauca.edu.co', estado: 'Aprobado' },
  { nombre: 'Vanessa Agredo', correo: 'vanessaagredo@Unicauca.edu.co', estado: 'En revision' },
];

async function mountTable(
  columns: Column[],
  value: any[] = ROWS,
  overrides: Partial<TableComponent> = {}
): Promise<{ fixture: ComponentFixture<TableComponent>; component: TableComponent}> {

  const fixture = TestBed.createComponent(TableComponent);
  const component = fixture.componentInstance;

  component.columns = columns;
  component.value = value;
  Object.assign(component, overrides);

  fixture.detectChanges();
  await fixture.whenStable();

  return { fixture, component }
}

describe('TableComponent', () => {
  let component: TableComponent;
  let fixture: ComponentFixture<TableComponent>;

  beforeEach(async() => {
    TestBed.configureTestingModule({
      imports: [ TableComponent ],
      providers: [ provideNoopAnimations() ]
    })
    .compileComponents();
  });

  it('Debe crearse correctamente', async () => {
    const { component } = await mountTable(COLUMNS_TEXT);
    expect(component).toBeTruthy();
  });

  it('Debe renderizar los encabezados definidos en las columnas', async () => {
    const { fixture } = await mountTable(COLUMNS_TEXT);

    const headers = fixture.nativeElement.querySelectorAll('th');

    expect(headers.length).toBe(COLUMNS_TEXT.length);
    expect(headers[0].textContent.trim()).toBe('Nombre');
    expect(headers[1].textContent.trim()).toBe('Correo');
  });

  it('Debe aplicarse el width definido en las columnas', async () => {
    const { fixture } = await mountTable(COLUMNS_TEXT);

    const headers = fixture.nativeElement.querySelectorAll('th');

    expect(headers[0].style.width).toBe('50%');
  });

  it('Debe renderizar una fila para cada elemento', async () => {
    const { fixture } = await mountTable(COLUMNS_TEXT);

    const rows = fixture.nativeElement.querySelectorAll('tbody tr');

    expect(rows.length).toBe(ROWS.length);
  });

  it('Debe mostrar el empty state cuando value este vacio', async () => {
    const { fixture } = await mountTable(COLUMNS_TEXT, []);

    const emptyState = fixture.debugElement.query(By.css('app-empty-state'));

    expect(emptyState).toBeTruthy();
  });

  it('Debe mostrar el mensaje personalizado en el empty state', async () => {
    const message = 'No hay trabajos registrados';
    const { fixture } = await mountTable(COLUMNS_TEXT, [], {
      emptyMessage: message,
    });

    const emptyState = fixture.debugElement.query(By.css('app-empty-state'));

    expect(emptyState.componentInstance.message).toBe(message);
  });

  it('Debe renderizar app-state en columnas del tipo estado', async () => {
    const { fixture } = await mountTable(COLUMS_STATE);
    const states = fixture.debugElement.queryAll(By.css('app-state'));
    expect(states.length).toBe(ROWS.length);
  });

  it('Debe pasar correctamente el valor al state component', async () =>{
    const { fixture } = await mountTable(COLUMS_STATE);

    const states = fixture.debugElement.queryAll(By.css('app-state'));

    expect(states[0].componentInstance.state).toBe('Aprobado');
    expect(states[1].componentInstance.state).toBe('En revision');
  });

  it('Debe renderizar botones de acción correctamente', async () => {
    const { fixture } = await mountTable(COLUMNS_ACTIONS);

    const buttons = fixture.debugElement.queryAll(By.css('td app-button-component'));

    expect(buttons.length).toBe(
      ROWS.length * COLUMNS_ACTIONS[1].actions!.length
    );
  });

  it('Debe emitir actionClick con acción y fila correcta', async () => {
    const { fixture, component } = await mountTable(COLUMNS_ACTIONS);

    const spy = jest.fn();
    component.actionClick.subscribe(spy);

    const buttons= fixture.debugElement.queryAll(By.css('td app-button-component'));

    buttons[0].componentInstance.onClick.emit();

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'ver',
        row: expect.any(Object),
      })
    );
  });

  it('No debe renderizar header buttons si esta vacío', async () => {
    const { fixture } = await mountTable(COLUMNS_TEXT, ROWS, {
      headerButtons: []
    });

    const caption = fixture.nativeElement.querySelector('.flex.justify-end');

    expect(caption).toBeNull();
  });

  it('Debe emitir un evento al click en header button', async () => {
    const { fixture, component } = await mountTable(COLUMNS_TEXT, ROWS, {
      headerButtons: [
        { label: 'Nuevo', variant: 'primary'}
      ]
    });

    const spy = jest.fn();
    component.headerButtonClick.subscribe(spy);

    const btn = fixture.debugElement.query(By.css('.flex.justify-end app-button-component'));

    btn.componentInstance.onClick.emit();

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        label: 'Nuevo',
        variant: 'primary'
      })
    );
  });

  it('Debe respetar el input del paginator', async () =>{
    const { fixture } = await mountTable(COLUMNS_TEXT, ROWS, {
      paginator: false
    });

    const pTable = fixture.debugElement.query(By.css('p-table'));

    expect(pTable.componentInstance.paginator).toBe(false);
  });

});
