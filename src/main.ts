import Chip8 from "./Chip8";
import "./style.css";
import { getMnemonic } from "./utils";
// import typescriptLogo from "./typescript.svg";

const VIDEO_SCALE = 10;
const FRAME_DELAY_TARGET_MS = 100;
const CYCLES_PER_FRAME = 2;

const CHIP8 = new Chip8();
// Make CHIP8 available in the window object for debugging
(window as any).CHIP8 = CHIP8;

const domCanvas = document.getElementById("canvas") as HTMLCanvasElement;
domCanvas.width = Chip8.VIDEO_W * VIDEO_SCALE;
domCanvas.height = Chip8.VIDEO_H * VIDEO_SCALE;
const domCanvasCtx = domCanvas.getContext("2d") as CanvasRenderingContext2D;

let loopRunning = false;
const keyboardState = new Map<string, boolean>();
const cycleDelay = {
  lastTimestampMs: 0,
};

function updateFieldHex(id: string, value: number, width: number) {
  const el = document.getElementById(id) as HTMLInputElement | null;
  if (!el) return;
  const hex = value.toString(16).toUpperCase().padStart(width, "0");
  if ("value" in el) {
    el.value = hex;
  } else {
    (el as HTMLInputElement).value = hex;
  }
}
function updateFieldStr(id: string, value: string, width: number) {
  const el = document.getElementById(id) as HTMLInputElement | null;
  if (!el) return;
  if ("value" in el) {
    el.value = value;
  } else {
    (el as HTMLInputElement).value = value;
  }
}
function updateRegisters() {
  updateFieldHex("op-reg", CHIP8.OPCODE, 4);
  updateFieldStr("op-mne", `${getMnemonic(CHIP8.OPCODE)}`, 4);
  updateFieldHex("pc-reg", CHIP8.R_PC, 4);
  updateFieldHex("i-reg", CHIP8.R_I, 4);
  updateFieldHex("sp-reg", CHIP8.R_SP, 2);
  updateFieldHex("dt-reg", CHIP8.R_DELAY_TIMER, 2);
  updateFieldHex("st-reg", CHIP8.R_AUDIO_TIMER, 2);
  for (let i = 0; i < 16; i++) {
    updateFieldHex(`v${i}-reg`, CHIP8.REG[i], 2);
  }
}

function renderVideoMemory() {
  // Draw chip8 video memory to video canvas
  const canvasVideo = document.createElement("canvas");
  canvasVideo.width = Chip8.VIDEO_W;
  canvasVideo.height = Chip8.VIDEO_H;
  const canvasVideoCtx = canvasVideo.getContext(
    "2d"
  ) as CanvasRenderingContext2D;
  const imageData = canvasVideoCtx.getImageData(
    0,
    0,
    Chip8.VIDEO_W,
    Chip8.VIDEO_H
  );
  for (let i = 0; i < Chip8.VIDEO_W * Chip8.VIDEO_H; i++) {
    const pixelIndex = i * 4;
    const pixelValue = CHIP8.videoMemory[i];
    imageData.data[pixelIndex] = pixelValue * 255;
    imageData.data[pixelIndex + 1] = pixelValue * 255;
    imageData.data[pixelIndex + 2] = pixelValue * 255;
    imageData.data[pixelIndex + 3] = 255;
  }
  canvasVideoCtx.putImageData(imageData, 0, 0);

  // Draw video canvas to dom canvas
  domCanvasCtx.imageSmoothingEnabled = false;
  domCanvasCtx.drawImage(
    canvasVideo,
    0,
    0,
    Chip8.VIDEO_W,
    Chip8.VIDEO_H,
    0,
    0,
    domCanvas.width,
    domCanvas.height
  );
}

function mainLoop(currentTimestampMs: number) {
  const dtMs = currentTimestampMs - cycleDelay.lastTimestampMs;
  if (dtMs < FRAME_DELAY_TARGET_MS) {
    if (loopRunning) {
      requestAnimationFrame(mainLoop);
    }
    return;
  }

  cycleDelay.lastTimestampMs = currentTimestampMs;
  // Update chip8 keypad memory
  CHIP8.keypadMemory[0x0] = keyboardState.get("1") ? 1 : 0;

  // Cycle chip8
  for (let i = 0; i < CYCLES_PER_FRAME; i++) {
    CHIP8.cycle();
  }
  updateRegisters();

  renderVideoMemory();

  // Request next frame
  if (loopRunning) {
    requestAnimationFrame(mainLoop);
  }
}

async function init() {
  // ROM SELECTOR POPULATION
  const romList = await fetch("/romList.json");
  const romListJson = await romList.json();
  console.log(romListJson);
  romListJson.forEach((rom: { name: string; path: string }) => {
    const option = document.createElement("option");
    option.value = rom.name;
    option.textContent = rom.name;
    document.getElementById("rom-select")?.appendChild(option);
  });

  // ROM LOADER EVENT LISTENER
  document
    .getElementById("load-rom-button")
    ?.addEventListener("click", async () => {
      const romSelect = document.getElementById(
        "rom-select"
      ) as HTMLSelectElement;
      const romFileName = romSelect.value;
      const romUrl = `/roms/${romFileName}`;
      const response = await fetch(romUrl);
      const arrayBuffer = await response.arrayBuffer();
      const romBytes = new Uint8Array(arrayBuffer);

      loopRunning = false;
      CHIP8.reset();
      CHIP8.loadRom(romBytes);
    });

  // HTML DOM BUTTONS
  const keyboardButtons = document.querySelectorAll("#keyboard-button");
  keyboardButtons.forEach((button) => {
    button.addEventListener("mouseup", () => {
      const keyCode = (button as HTMLButtonElement).dataset.key;
      keyboardState.set(keyCode || "", false);
    });
    button.addEventListener("mousedown", () => {
      const keyCode = (button as HTMLButtonElement).dataset.key;
      keyboardState.set(keyCode || "", true);
    });
  });

  // RUN BUTTON EVENT LISTENER
  document.getElementById("run-button")?.addEventListener("click", () => {
    loopRunning = true;
    requestAnimationFrame(mainLoop);
  });
  document.getElementById("pause-button")?.addEventListener("click", () => {
    loopRunning = false;
  });
  // CYCLE BUTTON EVENT LISTENER
  document.getElementById("cycle-button")?.addEventListener("click", () => {
    loopRunning = false;
    CHIP8.cycle();
    updateRegisters();
    renderVideoMemory();
  });
  // RESET BUTTON EVENT LISTENER
  document.getElementById("reset-button")?.addEventListener("click", () => {
    loopRunning = false;
    CHIP8.reset();
  });

  // KEYBOARD EVENT LISTENERS
  window.addEventListener("keydown", (e) => {
    const key = e.key.toUpperCase();
    console.log(key);
    keyboardState.set(key, true);
  });
  window.addEventListener("keyup", (e) => {
    const key = e.key.toUpperCase();
    console.log(key);
    keyboardState.set(key, false);
  });
}

window.addEventListener("DOMContentLoaded", () => {
  init();
});
