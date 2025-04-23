const { app, BrowserWindow, ipcMain, nativeImage } = require("electron");
const fs = require("fs").promises;
const path = require("path");
const express = require("express");
const url = require("url");

let win;

// Servidor para salvar imagens, e servir diretorio de imagens
const appServer = express();
appServer.use(express.json({ strict: false }));
appServer.use("/nok", express.static(path.join(app.getPath("pictures"), "sistema-visao-casquilhos", "nok")));
appServer.use("/ok", express.static(path.join(app.getPath("pictures"), "sistema-visao-casquilhos", "ok")));
appServer.use("/undefined", express.static(path.join(app.getPath("pictures"), "sistema-visao-casquilhos", "undefined")));

// Configuração da janela principal do Electron
app.whenReady().then(() => {
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

  appServer.listen(3000);
});

function setFolderPath(status) {
  let folderPath = "";
  switch (status) {
    case true:
      folderPath = path.join(app.getPath("pictures"), "sistema-visao-casquilhos", "ok");
      break;
    case false:
      folderPath = path.join(app.getPath("pictures"), "sistema-visao-casquilhos", "nok");
      break;
    default:
      folderPath = path.join(app.getPath("pictures"), "sistema-visao-casquilhos", "undefined");
  }
  return folderPath;
}

async function createFolder(path) {
  await fs.mkdir(path, { recursive: true });
}

async function writeFile(filePath, fileName, data) {
  try {
    const cleanedData = data.replace("data:image/png;base64,", "");
    await fs.writeFile(filePath, cleanedData, "base64");
    return {
      fileName: fileName,
      filePath: filePath,
      plcData: data,
    };
  } catch (error) {
    throw error;
  }
}

// Função para salvar imagem
async function saveImage(fileName, imgData, plcData) {
  const picturesDir = setFolderPath(plcData.inspecao)
  const filePath = path.join(picturesDir, fileName);

  await createFolder(picturesDir);
  writeFile(filePath, fileName, imgData);
  return {
    fileName: fileName,
    filePath: filePath,
    plcData: plcData,
  };
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
      return res.status(500).send("Erro ao salvar imagem");
    }
  });
  win.webContents.send("trigger-capture", req.body);
});

appServer.post("/message", (req, res) => {
  try {
    win.webContents.send("message", req.body);
    return res.status(202).send({ok: "ok"});
  } catch {
    return res.status(500).send({error: "Error ao identificar leitura"});
  }
})

ipcMain.handle("capture-page", async (event, rect) => {
  try {
    const image = await win.webContents.capturePage(rect);
    return image.toDataURL();
  } catch (err) {
    throw new Error("Erro ao capturar imagem");
  }
});
