import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SearchImgService } from '../../services/search-img.service';

@Component({
  selector: 'app-search-image',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './search-image.component.html',
  styleUrl: './search-image.component.scss',
})
export class SearchImageComponent {
  currentImg!: string;
  matricula!: string;
  desenho!: string;
  modalTitle: string = '';
  modalMessage: string = '';
  showModal: boolean = false;
  // Lembrar de mudar para IP
  private electronBaseUrl = 'http://localhost:3000';

  constructor(private searchService: SearchImgService) {}
  searchImg(type: string) {
    let searchValue!: string;
    if (type === 'matricula') {
      searchValue = this.matricula;
    } else {
      searchValue = this.desenho;
    }
    this.searchService.searchImg({ type: type, value: searchValue }).subscribe({
      next: (response) => {
        if (response) {
          const ok = response.ok === true ? 'ok' : 'nok';
          this.currentImg = `${this.electronBaseUrl}/${ok}/${response.name}`;
        }
      },
      error: (err) => {
        this.modalTitle = 'Erro';
        this.modalMessage = 'Ocorreu um erro na requisição. Tente novamente.';
        this.showModal = true;
      },
    });
  }

  closeModal() {
    this.showModal = false;
  }
}
