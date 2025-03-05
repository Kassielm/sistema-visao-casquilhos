const { app, BrowserWindow, ipcMain } = require("electron");
const fs = require("fs");
const path = require("path");
const express = require("express");

let mainWindow;

const appServer = express();
appServer.use(express.json({ strict: false }));

appServer.use(express.static(path.join(__dirname, "pictures")));
appServer.use(express.static(path.join(__dirname, "src/assets")));

function saveImage(fileName, imgData, callback, plcData) {
  const folderPath = plcData.ok === true ? "pictures/ok" : "pictures/nok";
  const picturesDir = path.join(__dirname, folderPath);
  const filePath = path.join(picturesDir, fileName);

  fs.mkdir(picturesDir, { recursive: true }, (err) => {
    if (err) {
      if (callback) {
        callback.status(500).send("Erro ao salvar imagem");
      }
      return;
    }
    fs.writeFile(
      filePath,
      imgData.replace(/^data:image\/png;base64,/, ""),
      "base64",
      (err) => {
        if (err) {
          console.error("Erro ao salvar imagem:", err);
          if (callback) {
            callback.status(500).send("Erro ao salvar imagem");
          }
          return;
        }
        const resultData = {
          fileName: fileName,
          filePath: filePath,
          plcData: plcData,
        };
        if (callback) {
          callback.status(202).json(resultData);
        }
      }
    );
  });
}

app.whenReady().then(() => {
  mainWindow = new BrowserWindow({
    width: 1980,
    height: 1080,
    fullscreen: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
    },
  });
  mainWindow.loadFile(
    path.join(__dirname, "dist/electron-angular-capture/browser/index.html")
  );

  appServer.listen(3000, () => {
    console.log("Servidor rodando na porta 3000");
  });
});

appServer.post("/capture", (req, res) => {
  const plcData = req.body;
  ipcMain.once("capture-response", (event, response) => {
    if (response.error) {
      return res.status(500).send(response.error);
    }
    const { imgData, fileName } = response;
    saveImage(fileName, imgData, res, plcData);
  });
  mainWindow.webContents.send("trigger-capture", req.body);
});

ipcMain.handle("capture-page", async (event, rect) => {
  try {
      const image = await mainWindow.webContents.capturePage(rect);
      return image.toDataURL();
  } catch (err) {
      console.error("Erro ao capturar imagem:", err);
      throw new Error("Erro ao capturar imagem");
  }
});
