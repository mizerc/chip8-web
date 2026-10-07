/**
 * Application holds DOM elements and interface
 * between the user interface and the CHIP8 emulator.
 */
import Chip8 from "./Chip8";
import { DomHandler } from "./DomHandler";

export class Application {
  FRAME_DELAY_TARGET_MS = 100;
  CYCLES_PER_FRAME = 2;
  baseURL = import.meta.env.BASE_URL;

  private chip8: Chip8;
  private domHandler: DomHandler;
  private loopState: {
    isRunning: boolean;
    lastTimestampMs: number;
  };
  constructor() {
    // Initialize application state here if needed
    this.chip8 = new Chip8();
    this.domHandler = new DomHandler();
    this.loopState = {
      isRunning: false,
      lastTimestampMs: 0,
    };
  }
  init = () => {
    this.domHandler.attachListeners({
      onResetPress: () => {
        this.loopState.isRunning = false;
        this.chip8.reset();
        this.domHandler.resetRegisters();
        this.domHandler.updateMemoryViewDom(this.chip8);
      },
      onRunPress: () => {
        this.loopState.isRunning = true;
        requestAnimationFrame(this.loop);
      },
      onPausePress: () => {
        this.loopState.isRunning = false;
      },
      onCyclePress: () => {
        this.loopState.isRunning = false;
        this.domHandler.updateMemoryViewDom(this.chip8);
        this.chip8.cycle();
        this.domHandler.updateRegisters(this.chip8);
        this.domHandler.renderVideoMemoryToCanva(this.chip8);
      },
    });
  };
  loop = (currentTimestampMs: number) => {
    // Timing
    const dtMs = currentTimestampMs - this.loopState.lastTimestampMs;
    if (dtMs < this.FRAME_DELAY_TARGET_MS) {
      if (this.loopState.isRunning) {
        requestAnimationFrame(this.loop);
      }
      return;
    }
    this.loopState.lastTimestampMs = currentTimestampMs;

    // Update input state
    this.chip8.updateKeyboardMemory(this.domHandler.keyboardState);

    // Cycle chip8
    for (let i = 0; i < this.CYCLES_PER_FRAME; i++) {
      this.chip8.cycle();
    }

    // Don't update dom register while cycling the chip8
    // updateRegisters();
    // updateMemoryView();

    // Update video memory to canvas
    this.domHandler.renderVideoMemoryToCanva(this.chip8);

    // Request next frame
    if (this.loopState.isRunning) {
      requestAnimationFrame(this.loop);
    }
  };
}

async function init() {
  // Update ROM select dropdown with available ROMs
  const romList = await fetch(`${this.baseURL}romList.json`);
  const romListJson = await romList.json();
  romListJson.forEach((rom: { name: string; path: string }) => {
    const option = document.createElement("option");
    option.value = rom.name;
    option.textContent = rom.name;
    document.getElementById("rom-select")?.appendChild(option);
  });

  // ROM loader event listener
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

      // LOAD ROM SEQUENCE
      loopRunning = false;
      chip8.reset();
      chip8.loadRom(romBytes);
      domHandler.updateMemoryViewDom(chip8);
    });
}
