import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-secondary-button-component',
  imports: [ButtonModule],
  templateUrl: './secondary-button-component.component.html',
  styleUrl: './secondary-button-component.component.css'
})
export class SecondaryButtonComponentComponent {
  @Input() label: string = '';
  @Input() icon?: string;
  @Input() disabled: boolean = false;
  @Input() type: 'button' | 'submit' = 'button';

  @Output() onClick = new EventEmitter<void>();

  handleClick() {
    if (!this.disabled) this.onClick.emit();
  }
}
