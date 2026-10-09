import Chip8 from "./Chip8";
import { getMnemonic } from "./getMnemonic";

const VIDEO_SCALE = 10;

export class DomHandler {
  keyboardState: Map<string, boolean>;
  domCanvas: HTMLCanvasElement;
  domCanvasCtx: CanvasRenderingContext2D;
  constructor() {
    // Initial keyboard state
    this.keyboardState = new Map<string, boolean>();

    // Canvas and context
    this.domCanvas = document.getElementById("canvas") as HTMLCanvasElement;
    this.domCanvas.width = Chip8.VIDEO_W * VIDEO_SCALE;
    this.domCanvas.height = Chip8.VIDEO_H * VIDEO_SCALE;
    this.domCanvasCtx = this.domCanvas.getContext(
      "2d",
    ) as CanvasRenderingContext2D;

    // Clear canvas initially
    this.domCanvasCtx.fillStyle = "black";
    this.domCanvasCtx.fillRect(
      0,
      0,
      this.domCanvas.width,
      this.domCanvas.height,
    );

    // Update ROM select dropdown with available ROMs
    const asyncUpdateRomList = async () => {
      const romList = await fetch(`${import.meta.env.BASE_URL}romList.json`);
      const romListJson = await romList.json();
      romListJson.forEach((rom: { name: string; path: string }) => {
        const option = document.createElement("option");
        option.value = rom.name;
        option.textContent = rom.name;
        document.getElementById("rom-select")?.appendChild(option);
      });
    };
    asyncUpdateRomList();
  }

  attachListeners = (handlers: {
    onResetPress: () => void;
    onStartStopPress: () => void;
    onCyclePress: () => void;
    onSpeedDropdownChange: (speed: number) => void;
    onRomReadDone: (romBytes: Uint8Array) => void;
  }) => {
    // DOM BUTTONS
    document.getElementById("reset-button")?.addEventListener("click", () => {
      handlers.onResetPress();
    });
    document
      .getElementById("start-stop-button")
      ?.addEventListener("click", () => {
        handlers.onStartStopPress();
      });

    document.getElementById("cycle-button")?.addEventListener("click", () => {
      handlers.onCyclePress();
    });

    // KEYBOARD EVENT
    window.addEventListener("keydown", (e) => {
      const key = e.key.toUpperCase();
      console.log(key);
      this.keyboardState.set(key, true);
    });
    window.addEventListener("keyup", (e) => {
      const key = e.key.toUpperCase();
      console.log(key);
      this.keyboardState.set(key, false);
    });

    // ROM SELECT OR LOAD ROM BUTTON
    document
      .getElementById("load-rom-button")
      ?.addEventListener("click", async () => {
        const romSelect = document.getElementById(
          "rom-select",
        ) as HTMLSelectElement;
        const romFileName = romSelect.value;
        const romUrl = `${import.meta.env.BASE_URL}roms/${romFileName}`;
        const response = await fetch(romUrl);
        const arrayBuffer = await response.arrayBuffer();
        const romBytes = new Uint8Array(arrayBuffer);
        handlers.onRomReadDone(romBytes);
      });
    // SPEED SELECTOR
    const speedSelect = document.getElementById(
      "speed-select",
    ) as HTMLSelectElement;
    speedSelect.addEventListener("change", () => {
      const speed = parseInt(speedSelect.value, 10);
      handlers.onSpeedDropdownChange(speed);
    });

    // DOM KEYPAD BUTTONS
    const keypadButtons = document.querySelectorAll(".keypad-button");
    keypadButtons.forEach((button) => {
      button.addEventListener("pointerdown", () => {
        // Enable state
        const keyCode = (button as HTMLButtonElement).dataset.key;
        if (keyCode) {
          this.keyboardState.set(keyCode, true);
        }
      });
      button.addEventListener("pointerup", () => {
        // Disable state
        const keyCode = (button as HTMLButtonElement).dataset.key;
        if (keyCode) {
          this.keyboardState.set(keyCode, false);
        }
      });
      button.addEventListener("pointerleave", () => {
        // Disable state when pointer leaves the button
        const keyCode = (button as HTMLButtonElement).dataset.key;
        if (keyCode) {
          this.keyboardState.set(keyCode, false);
        }
      });
    });
  };

  disableDomControlBtos = (disable: boolean) => {
    const startStopButton = document.getElementById("start-stop-button");
    const cycleButton = document.getElementById("cycle-button");
    const resetButton = document.getElementById("reset-button");
    const speedSelector = document.getElementById("speed-select");

    if (!startStopButton || !cycleButton || !resetButton || !speedSelector) {
      return;
    }

    if (disable) {
      (startStopButton as HTMLButtonElement).disabled = true;
      (cycleButton as HTMLButtonElement).disabled = true;
      (resetButton as HTMLButtonElement).disabled = true;
      (speedSelector as HTMLSelectElement).disabled = true;

      startStopButton.classList.add("disabled");
      cycleButton.classList.add("disabled");
      resetButton.classList.add("disabled");
      speedSelector.classList.add("disabled");
    } else {
      (startStopButton as HTMLButtonElement).disabled = false;
      (cycleButton as HTMLButtonElement).disabled = false;
      (resetButton as HTMLButtonElement).disabled = false;
      (speedSelector as HTMLSelectElement).disabled = false;

      startStopButton.classList.remove("disabled");
      cycleButton.classList.remove("disabled");
      resetButton.classList.remove("disabled");
      speedSelector.classList.remove("disabled");
    }
  };

  updateFieldStr = (id: string, value: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (el instanceof HTMLInputElement) {
      el.value = value;
    } else {
      el.textContent = value;
    }
  };
  updateFieldHex = (id: string, value: number, width: number) => {
    const el = document.getElementById(id);
    if (!el) return;
    const hex = "0x" + value.toString(16).toUpperCase().padStart(width, "0");
    if (el instanceof HTMLInputElement) {
      el.value = hex;
    } else {
      el.textContent = hex;
    }
  };

  updateDomRegisters = (chip8: Chip8) => {
    // Update memmonic field
    this.updateFieldStr("op-mne", `${getMnemonic(chip8.OPCODE)}`);
    // Update core fields
    this.updateFieldHex("i-reg", chip8.R_I, 3);
    this.updateFieldHex("op-reg", chip8.OPCODE, 4);
    this.updateFieldHex("pc-reg", chip8.R_PC, 4);
    this.updateFieldHex("sp-reg", chip8.R_SP, 2);
    this.updateFieldHex("dt-reg", chip8.R_DELAY_TIMER, 2);
    this.updateFieldHex("st-reg", chip8.R_AUDIO_TIMER, 2);
    // Update V registers (V0 to VF, 8 bits)
    for (let i = 0; i < 16; i++) {
      this.updateFieldHex(`v${i}-reg`, chip8.REG[i], 1);
    }
  };

  resetDomRegisters = () => {
    this.updateFieldStr("op-mne", "");
    this.updateFieldHex("i-reg", 0, 3);
    this.updateFieldHex("op-reg", 0, 4);
    this.updateFieldHex("pc-reg", Chip8.START_ADDRESS, 4);
    this.updateFieldHex("sp-reg", 0, 2);
    this.updateFieldHex("dt-reg", 0, 2);
    this.updateFieldHex("st-reg", 0, 2);
    for (let i = 0; i < 16; i++) {
      this.updateFieldHex(`v${i}-reg`, 0, 1);
    }
  };

  flipLedIndicator = () => {
    const ledIndicator = document.getElementById("led-indicator");
    if (!ledIndicator) {
      return;
    }
    if (ledIndicator.classList.contains("led-off")) {
      ledIndicator.classList.remove("led-off");
      ledIndicator.classList.add("led-on");
    } else {
      ledIndicator.classList.remove("led-on");
      ledIndicator.classList.add("led-off");
    }
  };
  updateLedIndicator = (state: "on" | "off" | "halt" | "alert" | "reset") => {
    const ledIndicator = document.getElementById("led-indicator");
    if (!ledIndicator) {
      return;
    }
    if (state === "on") {
      ledIndicator.classList.remove(
        "led-off",
        "led-halt",
        "led-alert",
        "led-reset",
      );
      ledIndicator.classList.add("led-on");
    } else if (state === "off") {
      ledIndicator.classList.remove(
        "led-on",
        "led-halt",
        "led-alert",
        "led-reset",
      );
      ledIndicator.classList.add("led-off");
    } else if (state === "halt") {
      ledIndicator.classList.remove(
        "led-on",
        "led-off",
        "led-alert",
        "led-reset",
      );
      ledIndicator.classList.add("led-halt");
    } else if (state === "alert") {
      ledIndicator.classList.remove(
        "led-on",
        "led-off",
        "led-halt",
        "led-reset",
      );
      ledIndicator.classList.add("led-alert");
    } else if (state === "reset") {
      ledIndicator.classList.remove(
        "led-on",
        "led-off",
        "led-halt",
        "led-alert",
      );
      ledIndicator.classList.add("led-reset");
    }
  };
  updateStartStopButton = (state: "START" | "STOP") => {
    const startStopButton = document.getElementById("start-stop-button");
    if (!startStopButton) {
      return;
    }
    if (state === "START") {
      startStopButton.textContent = "START";
    } else if (state === "STOP") {
      startStopButton.textContent = "STOP\u00A0";
    }
  };
  updateSpeedSelector = (targetFps: number) => {
    const speedSelect = document.getElementById(
      "speed-select",
    ) as HTMLSelectElement;
    speedSelect.value = targetFps.toString();
  };

  // Draw chip8 video memory to video canvas
  renderVideoMemoryToCanva = (chip8: Chip8) => {
    // Get a new canvas
    const backCanvas = document.createElement("canvas");
    backCanvas.width = Chip8.VIDEO_W;
    backCanvas.height = Chip8.VIDEO_H;
    const backCanvasCtx = backCanvas.getContext(
      "2d",
    ) as CanvasRenderingContext2D;
    // Create an ImageData object to manipulate pixel data directly
    const imageData = backCanvasCtx.getImageData(
      0,
      0,
      Chip8.VIDEO_W,
      Chip8.VIDEO_H,
    );
    // Fill the ImageData object with pixel values from the CHIP8 video memory
    for (let i = 0; i < Chip8.VIDEO_W * Chip8.VIDEO_H; i++) {
      const pixelIndex = i * 4;
      const pixelValue = chip8.videoMemory[i]; // 0 or 1
      imageData.data[pixelIndex] = pixelValue * 255;
      imageData.data[pixelIndex + 1] = pixelValue * 255;
      imageData.data[pixelIndex + 2] = pixelValue * 255;
      imageData.data[pixelIndex + 3] = 255;
    }
    // Update the video canvas with the new image data
    backCanvasCtx.putImageData(imageData, 0, 0);

    /**
     * Since backCanvas has lower resolution,
     * it will be scaled up when drawn onto the domCanvas,
     * creating a pixelated effect.
     */

    // Draw backCanvas onto domCanvas
    this.domCanvasCtx.imageSmoothingEnabled = false;
    this.domCanvasCtx.drawImage(
      backCanvas,
      0,
      0,
      Chip8.VIDEO_W,
      Chip8.VIDEO_H,
      0,
      0,
      this.domCanvas.width,
      this.domCanvas.height,
    );
  };
  disableLoadButton = (disable: boolean) => {
    const loadButton = document.getElementById(
      "load-rom-button",
    ) as HTMLButtonElement;
    if (disable) {
      loadButton.disabled = true;
      loadButton.classList.add("disabled");
    } else {
      loadButton.disabled = false;
      loadButton.classList.remove("disabled");
    }
  };
  updateMemoryDumpDom = (chip8: Chip8) => {
    const memoryViewDom = document.getElementById(
      "memory-textarea",
    ) as HTMLTextAreaElement;
    if (!memoryViewDom) return;

    // BUILD MEMORY DUMP TEXT
    let memoryText = "";
    const bytesPerLine = 16;
    const totalBytes = chip8.memory.length;
    for (let addr = 0; addr < totalBytes; addr += bytesPerLine) {
      // Address column
      const addrHex = addr.toString(16).toUpperCase().padStart(4, "0");
      memoryText += `${addrHex}:`;

      // For each byte of current line
      for (let byteIdx = 0; byteIdx < bytesPerLine; byteIdx++) {
        if (addr + byteIdx < totalBytes) {
          const currentAddr = addr + byteIdx;
          const byte = chip8.memory[currentAddr];
          const byteHex = byte.toString(16).toUpperCase().padStart(2, "0");

          // Highlight PC and PC+1 bytes with brackets
          if (currentAddr === chip8.R_PC) {
            memoryText += `[${byteHex}`;
          } else if (currentAddr === chip8.R_PC + 1) {
            memoryText += ` ${byteHex}]`;
          }
          // Print regular byte
          else {
            const prevChar = memoryText.charAt(memoryText.length - 1);
            if (prevChar == "]") {
              memoryText += "" + byteHex;
            } else {
              memoryText += " " + byteHex;
            }
          }
        } else {
          memoryText += "X";
        }
      }

      // ASCII column
      const prevChar = memoryText.charAt(memoryText.length - 1);
      if (prevChar == "]") {
        memoryText += "| ";
      } else {
        memoryText += " | ";
      }

      for (let i = 0; i < bytesPerLine; i++) {
        if (addr + i < totalBytes) {
          const byte = chip8.memory[addr + i];
          // Print ASCII character, if printable, otherwise '.'
          const char =
            byte >= 32 && byte <= 126 ? String.fromCharCode(byte) : ".";
          memoryText += char;
        }
      }

      memoryText += "\n";
    }

    memoryViewDom.value = memoryText;

    // Auto-scroll to PC location
    const pcLine = Math.floor(chip8.R_PC / bytesPerLine);
    const totalLines = Math.ceil(totalBytes / bytesPerLine);
    const lineHeight = memoryViewDom.scrollHeight / totalLines;

    // Center the PC line in the viewport
    const viewportHeight = memoryViewDom.clientHeight;
    const scrollPosition =
      pcLine * lineHeight - viewportHeight / 2 + lineHeight / 2;

    memoryViewDom.scrollTop = Math.max(0, scrollPosition);
  };
}
