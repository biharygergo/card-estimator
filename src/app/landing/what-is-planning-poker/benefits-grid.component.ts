import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-benefits-grid',
  imports: [CommonModule],
  template: `
    <div class="benefits-container">
      <div class="benefit-card" *ngFor="let benefit of benefits">
        <h3>{{ benefit.title }}</h3>
        <p>{{ benefit.description }}</p>
      </div>
    </div>
  `,
  styles: [`
    .benefits-container {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 2rem;
      margin: 3rem 0;
      padding: 0 1rem;
    }
    
    .benefit-card {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(128, 194, 242, 0.2);
      border-radius: 16px;
      padding: 2rem;
      text-align: center;
    }
    
    h3 {
      color: white;
      font-size: 1.4rem;
      font-weight: 600;
      margin: 0 0 1rem 0;
      line-height: 1.4;
    }
    
    p {
      color: rgba(255, 255, 255, 0.8);
      font-size: 0.95rem;
      line-height: 1.6;
      margin: 0;
    }
    
    @media (max-width: 768px) {
      .benefits-container {
        grid-template-columns: 1fr;
        gap: 1.5rem;
      }
      
      .benefit-card {
        padding: 1.5rem;
      }
      
      h3 {
        font-size: 1.2rem;
      }
      
      p {
        font-size: 0.9rem;
      }
    }
  `]
})
export class BenefitsGridComponent {
  benefits = [
    {
      title: '🛡️ No Bias',
      description: 'Simultaneous reveal prevents anchoring bias and ensures honest, independent estimates from everyone.',
      icon: ''
    },
    {
      title: '👥 Full Participation',
      description: 'Everyone plays a card, giving equal voice to all team members regardless of seniority.',
      icon: ''
    },
    {
      title: '💬 Better Discussion',
      description: 'Diverging estimates trigger conversations that uncover hidden complexities and share knowledge.',
      icon: ''
    },
    {
      title: '🤝 Team Consensus',
      description: 'Collaborative agreement builds commitment and shared ownership of the estimates.',
      icon: ''
    },
    {
      title: '⚡ Fast & Flexible',
      description: 'Relative sizing with coarse numbers makes estimation quick without getting bogged in details.',
      icon: ''
    },
    {
      title: '📈 Improved Accuracy',
      description: 'Group wisdom and iterative refinement lead to more realistic estimates over time.',
      icon: ''
    }
  ];
}
