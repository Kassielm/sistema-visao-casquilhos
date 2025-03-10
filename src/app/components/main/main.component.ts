import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';

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
  ngOnInit() {
    // fica escutando o evento de captura
    window.electron.onTriggerCapture((event, data) => {
      this.captureIframe();
    });
  }

  async captureIframe() {
    try {
      const iframe = document.getElementById('iframe');
      if (!iframe) {
        throw new Error('Iframe não encontrado');
      }
      const rect = iframe.getBoundingClientRect();
      const recort = { x:230, y: 122, width: 1145, height: 664 };
      const imgData = await window.electron.capturePage(recort);
      const fileName = `${Date.now()}.png`;
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
