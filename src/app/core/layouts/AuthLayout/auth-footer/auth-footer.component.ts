import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-auth-footer',
  imports: [ CommonModule ],
  templateUrl: './auth-footer.component.html',
  styleUrls: ['./auth-footer.component.css']
})
export class AuthFooterComponent {
  currentYear = new Date().getFullYear();
  version = '1.0.0';

}
