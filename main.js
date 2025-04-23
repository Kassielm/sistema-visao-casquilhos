const { app, BrowserWindow, ipcMain, nativeImage, screen } = require("electron");
const fs = require("fs").promises;
const path = require("path");
const express = require("express");
const url = require("url");

// Variável global para a janela principal
let win;

// Caminho para o arquivo de configurações
const configPath = path.join(app.getPath("userData"), "config.json");

// Função para carregar as configurações
async function loadConfig() {
  try {
    const data = await fs.readFile(configPath, "utf8");
    return JSON.parse(data);
  } catch (err) {
    // Retorna um objeto vazio se o arquivo não existir ou houver erro
    return {};
  }
}

// Função para salvar as configurações
async function saveConfig(config) {
  try {
    await fs.writeFile(configPath, JSON.stringify(config, null, 2), "utf8");
  } catch (err) {
    console.error("Erro ao salvar configurações:", err);
  }
}

// Configuração do servidor Express
const appServer = express();
appServer.use(express.json({ strict: false }));

// Configura rotas estáticas para diretórios de imagens
const picturesBasePath = path.join(app.getPath("pictures"), "sistema-visao-casquilhos");
appServer.use("/nok", express.static(path.join(picturesBasePath, "nok")));
appServer.use("/ok", express.static(path.join(picturesBasePath, "ok")));
appServer.use("/undefined", express.static(path.join(picturesBasePath, "undefined")));

// Função para obter o monitor secundário
async function getSecondaryMonitor() {
  const displays = screen.getAllDisplays();
  const secondary = displays.find(
    (display) => display.bounds.x !== 0 || display.bounds.y !== 0
  );

  if (secondary) {
    return secondary;
  }

  // Fallback: usa bounds salvos ou do monitor principal
  const config = await loadConfig();
  const savedBounds = config.secondaryBounds;
  return {
    bounds: savedBounds || displays[0].bounds,
    id: displays[0].id,
  };
}

// Configuração da janela principal do Electron
app.whenReady().then(async () => {
  // Obtém o monitor secundário
  const secondaryDisplay = await getSecondaryMonitor();

  // Salva as coordenadas do monitor secundário, se não existirem
  const config = await loadConfig();
  if (!config.secondaryBounds) {
    config.secondaryBounds = secondaryDisplay.bounds;
    await saveConfig(config);
  }

  // Cria a janela principal
  win = new BrowserWindow({
    width: 1980,
    height: 1080,
    x: secondaryDisplay.bounds.x,
    y: secondaryDisplay.bounds.y,
    fullscreen: true,
    icon: "favicon.ico",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: true,
      contextIsolation: true,
      webSecurity: false,
    },
  });

  // Carrega o arquivo HTML
  win.loadURL(
    url.format({
      pathname: path.join(__dirname, "dist/sistema-visao-casquilhos/browser/index.html"),
      protocol: "file:",
      slashes: true,
    })
  );

  // Impede a janela de ser movida para fora do monitor secundário
  win.on("move", async () => {
    const config = await loadConfig();
    const secondaryBounds = config.secondaryBounds;
    if (secondaryBounds) {
      win.setBounds({
        x: secondaryBounds.x,
        y: secondaryBounds.y,
        width: 1980,
        height: 1080,
      });
      win.setFullScreen(true);
    }
  });

  // Restaura a janela no monitor secundário quando ele é reconectado
  screen.on("display-added", async (event, display) => {
    if (display.bounds.x !== 0 || display.bounds.y !== 0) {
      const config = await loadConfig();
      config.secondaryBounds = display.bounds;
      await saveConfig(config);
      win.setBounds({
        x: display.bounds.x,
        y: display.bounds.y,
        width: 1980,
        height: 1080,
      });
      win.setFullScreen(true);
    }
  });

  // Inicia o servidor Express na porta 3000
  appServer.listen(3000);
});

// Função para definir o caminho da pasta com base no status
function setFolderPath(status) {
  const basePath = path.join(app.getPath("pictures"), "sistema-visao-casquilhos");
  switch (status) {
    case true:
      return path.join(basePath, "ok");
    case false:
      return path.join(basePath, "nok");
    default:
      return path.join(basePath, "undefined");
  }
}

// Função para criar uma pasta recursivamente
async function createFolder(folderPath) {
  await fs.mkdir(folderPath, { recursive: true });
}

// Função para escrever um arquivo de imagem
async function writeFile(filePath, fileName, data) {
  try {
    const cleanedData = data.replace("data:image/png;base64,", "");
    await fs.writeFile(filePath, cleanedData, "base64");
    return {
      fileName,
      filePath,
      plcData: data,
    };
  } catch (error) {
    throw error;
  }
}

// Função para salvar uma imagem
async function saveImage(fileName, imgData, plcData) {
  const picturesDir = setFolderPath(plcData.inspecao);
  const filePath = path.join(picturesDir, fileName);

  await createFolder(picturesDir);
  await writeFile(filePath, fileName, imgData);
  return {
    fileName,
    filePath,
    plcData,
  };
}

// Rotas do servidor Express
appServer.post("/capture", (req, res) => {
  const plcData = req.body;
  ipcMain.once("capture-response", async (event, response) => {
    if (response.error) {
      return res.status(500).send(response.error);
    }
    const { imgData, fileName } = response;
    if (plcData.salvar_dados === true) {
      const result = await saveImage(fileName, imgData, plcData);
      return res.status(202).send(result);
    }
    return res.status(400).send({ error: "Inspeção Nok" });
  });
  win.webContents.send("trigger-capture", req.body);
});

appServer.post("/message", (req, res) => {
  try {
    win.webContents.send("message", req.body);
    return res.status(202).send({ ok: "ok" });
  } catch {
    return res.status(500).send({ error: "Erro ao identificar leitura" });
  }
});

appServer.post("/status-lora", (req, res) => {
  try {
    win.webContents.send("status-lora", req.body);
    return res.status(202).send({ ok: "ok" });
  } catch {
    return res.status(500).send({ error: "Erro ao identificar o status" });
  }
});

// Manipulador IPC para captura de página
ipcMain.handle("capture-page", async (event, rect) => {
  try {
    const image = await win.webContents.capturePage(rect);
    return image.toDataURL();
  } catch (err) {
    throw new Error("Erro ao capturar imagem");
  }
});
