import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-primary-button-component',
  imports: [ButtonModule],
  templateUrl: './primary-button-component.component.html',
  styleUrl: './primary-button-component.component.css'
})
export class PrimaryButtonComponentComponent {
  @Input() label: string = '';
  @Input() icon?: string;
  @Input() disabled: boolean = false;
  @Input() type: 'button' | 'submit' = 'button';

  @Output() onClick = new EventEmitter<void>();

  handleClick() {
    if (!this.disabled) this.onClick.emit();
  }
 }
