import { Component } from '@angular/core';
import { AuthFooterComponent } from '../auth-footer/auth-footer.component';
import { AuthHeaderComponent } from '../auth-header/auth-header.component';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-auth-layout',
  imports: [AuthHeaderComponent, AuthFooterComponent, RouterOutlet],
  templateUrl: './auth-layout.component.html',
  styleUrls: ['./auth-layout.component.css']
})
export class AuthLayoutComponent {

}
