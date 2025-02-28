import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';

declare global {
  interface Window {
    electron: {
      capturePage: (rect: { x: number, y: number, width: number, height: number }) => Promise<string>;
      onTriggerCapture: (callback: (event: any, data: any) => void) => void;
      sendCaptureResponse: (response: { fileName: string, imgData: string, error?: string }) => void;
    };
  }
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  ngOnInit() {
    // fica escutando, e quando é chamado, chama o método captureIframe
    window.electron.onTriggerCapture((event, data) => {
      this.captureIframe();
    });
  }

  async captureIframe() {
    try {
      const iframe = document.getElementById("iframe");
      if (!iframe) {
        throw new Error("Iframe não encontrado");
      }
      const rect = iframe.getBoundingClientRect();
      const captureRect = {
        x: 410,
        y: 200,
        width: 300,
        height: 300
      };
      const imgData = await window.electron.capturePage(captureRect);
      const fileName = `${Date.now()}.png`;
      window.electron.sendCaptureResponse({ fileName, imgData }); // Envia apenas fileName e imgData
    } catch (err: any) {
      window.electron.sendCaptureResponse({ fileName: "", imgData: "", error: err.message });
    }
  }
}
