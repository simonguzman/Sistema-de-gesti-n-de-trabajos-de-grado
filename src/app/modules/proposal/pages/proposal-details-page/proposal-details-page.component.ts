import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProposalService } from '../../services/proposal.service';
import { Proposal } from '../../interfaces/proposal.interface';
import { ButtonComponent } from "../../../../shared/components/button-component/button-component.component";

@Component({
  selector: 'app-proposal-details-page',
  imports: [CommonModule, ButtonComponent],
  templateUrl: './proposal-details-page.component.html',
  styleUrls: ['./proposal-details-page.component.css']
})
export class ProposalDetailsPageComponent implements OnInit {

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private proposalService = inject(ProposalService);

  proposal = signal<Proposal | null>(null);
  isLoading = signal(true);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if(!id){
      this.router.navigate(['/proposal']);
      return;
    }

    this.proposalService.getProposalByIdMock(id).subscribe({
      next: (data) => {
        if(!data){
          this.router.navigate(['/proposal']);
          return;
        }
        this.proposal.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.router.navigate(['/proposal'])
      }
    });
  }

  goBack(){
    this.router.navigate(['/proposal'])
  }

}
