import { Component, NgZone, OnInit } from '@angular/core';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent implements OnInit {
  logoUrl = 'assets/logo-conecsa-horizontal.webp';
  matricula!: string;
  desenho!: string;
  transpalet!: string;
  receita!: string;

  constructor(private zone: NgZone) {}

  ngOnInit() {
    window.electron.onTriggerMessage((event: any, data: any) => {
      this.matricula = data.matricula;
      this.desenho = data.desenho;
      this.transpalet = data.transpalet;
      this.receita = data.receita;
    });
  }
}
