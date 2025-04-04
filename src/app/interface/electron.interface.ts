import { ScreenData } from "../../types/screenData.type";
import { TriggerData } from "../../types/triggerData.type";
import { StatusLora } from "../../types/statusLora.type";

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
