const { app, BrowserWindow, ipcMain, nativeImage } = require("electron");
const fs = require("fs");
const path = require("path");
const express = require("express");
const url = require("url");

let win;

// Servidor para salvar imagens, e servir diretorio de imagens
const appServer = express();
appServer.use(express.json({ strict: false }));
appServer.use("/nok", express.static(path.join(__dirname, "pictures/nok")));
appServer.use("/ok", express.static(path.join(__dirname, "pictures/ok")));
appServer.use("/undefined", express.static(path.join(__dirname, "pictures/undefined")));

// Configuração da janela principal do Electron
app.whenReady().then(() => {
  const iconPath = path.join(__dirname, "favicon.ico");
  icon = nativeImage.createFromPath(iconPath);

  if (app.dock) {
    app.dock.setIcon(icon);
  }

  win = new BrowserWindow({
    width: 1980,
    height: 1080,
    fullscreen: true,
    icon: 'favicon.ico',
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: true,
      contextIsolation: true,
      webSecurity: false,
      devTools: true,
    },
  });
  win.loadURL(
    url.format({
      pathname: path.join(__dirname, "dist/sistema-visao-casquilhos/browser/index.html"),
      protocol: "file:",
      slashes: true,
    })
  );

  appServer.listen(3000, () => {
    console.log("Servidor rodando na porta 3000");
  });
});

function setFolderPath(status) {
  let folderPath = "";
  switch (status) {
    case true:
      folderPath = 'pictures/ok';
      break;
    case false:
      folderPath = 'pictures/nok';
      break;
    default:
      folderPath = 'pictures/undefined';
  }
  return folderPath;
}

function createFolder(path) {
  fs.mkdir(path, { recursive: true }, (result) => {
    return result;
  });
}

async function writeFile(filePath, fileName, data) {
  return new Promise((resolve, reject) => {
    fs.writeFile(
      filePath,
      data.replace("data:image/png;base64,", ""),
      "base64",
      (err) => {
        if (err) {
          console.error("error ao escrever o arquivo:", err);
          reject(err);
        } else {
            const resultData = {
              fileName: fileName,
              filePath: filePath,
              plcData: data,
            };
          resolve(resultData);
        }
      }
    );
  });
}

// Função para salvar imagem
async function saveImage(fileName, imgData, plcData) {
  const picturesDir = setFolderPath(plcData.inspecao)
  const filePath = path.join(picturesDir, fileName);

  createFolder(picturesDir);
  return await writeFile(filePath, fileName, imgData);
}

// Recebe a requisição do node e chama a função para capturar a imagem no angular
appServer.post("/capture", (req, res) => {
  const plcData = req.body;
  ipcMain.once("capture-response", async (event, response) => {
    if (response.error) {
      return res.status(500).send(response.error);
    }
    const { imgData, fileName } = response;
    try {
      const result = await saveImage(fileName, imgData, plcData);
      return res.status(202).send(result);
    } catch (error) {
      console.error("Erro ao salvar imagem:", error);
      return res.status(500).send("Erro ao salvar imagem");
    }
  });
  win.webContents.send("trigger-capture", req.body);
});

ipcMain.handle("capture-page", async (event, rect) => {
  try {
    const image = await win.webContents.capturePage(rect);
    return image.toDataURL();
  } catch (err) {
    console.error("Erro ao capturar imagem:", err);
    throw new Error("Erro ao capturar imagem");
  }
});
