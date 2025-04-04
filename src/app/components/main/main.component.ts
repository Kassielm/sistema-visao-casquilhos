import { CommonModule } from '@angular/common';
import { Component, NgZone, OnInit } from '@angular/core';
import { ScreenData } from '../../../types/screenData.type';
import { TriggerData } from '../../../types/triggerData.type';
import { StatusLora } from '../../../types/statusLora.type';

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
      onTriggerCapture: (callback: (event: Event, data: ScreenData) => void) => void;
      sendCaptureResponse: (response: {
        fileName: string;
        imgData: string;
        error?: string;
      }) => void;
      onTriggerMessage: (callback: (event: Event, data: TriggerData) => void) => void;
      onTriggerStatusLora: (callback: (event: Event, data: StatusLora) => void) => void;
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
    this.listenFromNode();
  }

  private listenFromNode() {
    this.screenData();
    this.triggerMessage();
    this.statusLora();
  }

  private statusLora() {
    window.electron.onTriggerStatusLora((_event: Event, data: StatusLora) =>
      data.status
        ? this.setMessage('Sistema de visão habilitado')
        : this.setMessage('Sistema de visão desabilitado')
    );
  }

  private triggerMessage() {
    window.electron.onTriggerMessage((_event: Event, data: TriggerData) => {
      if (data.leitura) this.setMessage('Leitura do código realizada');
    });
  }

  private screenData() {
    window.electron.onTriggerCapture((_event: Event, data: ScreenData) =>
      this.setScreenData(data)
    );
  }

  private setScreenData(data: ScreenData) {
    this.matricula = data.matricula;
    this.captureIframe();
    this.setMessage(data.status);
  }

  setMessage(text: string) {
    this.zone.run(() => (this.statusText = text));
  }

  async captureIframe() {
    try {
      const iframe = document.getElementById('iframe');
      if (!iframe) {
        throw new Error('Iframe não encontrado');
      }
      const recort = { x: 330, y: 85, width: 1535, height: 980 };
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
