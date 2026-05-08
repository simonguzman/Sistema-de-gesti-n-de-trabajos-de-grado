import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProposalService } from '../../services/proposal.service';
import { Proposal } from '../../interfaces/proposal.interface';
import { ButtonComponent } from "../../../../shared/components/button-component/button-component.component";
import { UserService } from '../../../users/services/user.service';

@Component({
  selector: 'app-proposal-details-page',
  imports: [CommonModule, ButtonComponent],
  templateUrl: './proposal-details-page.component.html',
  styleUrls: ['./proposal-details-page.component.css']
})
export class ProposalDetailsPageComponent implements OnInit {

  protected route           = inject(ActivatedRoute);
  protected router          = inject(Router);
  private proposalService = inject(ProposalService);
  private userService = inject(UserService);

  proposal = signal<Proposal | null>(null);

  ngOnInit(): void {
    const id = this.route.parent?.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/proposal']);
      return;
    }

    this.proposalService.getProposalByIdMock(id).subscribe({
      next:  (data) => data
        ? this.proposal.set(data)
        : this.router.navigate(['/proposal']),
      error: () => this.router.navigate(['/proposal'])
    });
  }

  getMemberName(id: string | undefined): string {
    return this.userService.getUserFullName(id);
  }

  getAuthors(ids: string[] | undefined): string {
    return this.userService.getAuthorsNames(ids);
  }

}
