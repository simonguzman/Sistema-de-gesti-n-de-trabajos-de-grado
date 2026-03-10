import { Component } from '@angular/core';
import { TableComponentComponent } from "../../../shared/components/table-component/table-component.component";
import { ButtonComponent } from '../../../shared/components/button-component/button-component.component';

@Component({
  selector: 'app-users-page',
  imports: [TableComponentComponent, ButtonComponent],
  templateUrl: './users-page.component.html',
  styleUrl: './users-page.component.css',
})
export class UsersPageComponent { }
