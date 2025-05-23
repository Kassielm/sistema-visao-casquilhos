import { CommonModule } from '@angular/common';
import { Component, NgZone, OnInit } from '@angular/core';

// declaração de interface do electron
declare global {
  interface Window {
    electron: {
      capturePage: (rect: {
        x: number;
        y: number;
        width: number;
        height: number;
      }) => Promise<string>;
      onTriggerCapture: (callback: (event: any, data: any) => void) => void;
      sendCaptureResponse: (response: {
        fileName: string;
        imgData: string;
        error?: string;
      }) => void;
      onTriggerMessage: (callback: (event: any, data: any) => void) => void;
    };
  }
}

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss',
})
export class MainComponent implements OnInit {
  statusText: string = 'Status Inspeção';
  matricula!: string;

  constructor(private zone: NgZone) {}

  ngOnInit() {
    // fica escutando o evento de captura
    window.electron.onTriggerCapture((event: any, data: any) => {
      this.matricula = data.matricula;
      this.captureIframe();
      this.changeMessage(data.status);
    })
    window.electron.onTriggerMessage((event: any, data: any) => {
      if (data.leitura) {
        this.changeMessage("Leitura do código realizada");
      }
    })
  }

  changeMessage(text: string) {
    this.zone.run(() => {
      this.statusText = text;
      console.log(this.statusText)
    })
  }

  async captureIframe() {
    try {
      const iframe = document.getElementById('iframe');
      if (!iframe) {
        throw new Error('Iframe não encontrado');
      }
      const recort = { x: 300, y: 144, width: 1087, height: 654 };
      const imgData = await window.electron.capturePage(recort);
      const fileName = `${this.matricula}_${Date.now()}.png`;
      window.electron.sendCaptureResponse({ fileName, imgData });
    } catch (err: any) {
      window.electron.sendCaptureResponse({
        fileName: '',
        imgData: '',
        error: err.message,
      });
    }
  }
}
