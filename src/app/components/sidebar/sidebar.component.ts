import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent implements OnInit {
  logoUrl = 'assets/logo-conecsa-horizontal.webp';
  matricula!: string;
  desenho!: string;
  transpalet!: string;
  receita!: string;
  data = new Date();

  constructor() {
    setInterval(() => {
      this.data = new Date();
    }, 1000);
  }

  ngOnInit() {
    window.electron.onTriggerCapture((event: any, data: any) => {
      if (data.salvar_dados) {
        this.matricula = '';
        this.desenho = '';
        this.transpalet = '';
        this.receita = 'Sem Receita';
      }}
    )
    window.electron.onTriggerMessage((event: any, data: any) => {
      this.matricula = data.matricula;
      this.desenho = data.desenho;
      this.transpalet = data.transpalet;
      this.receita = data.receita;
    });
  }
}
