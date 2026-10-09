/**
 * Application holds DOM elements and interface
 * between the user interface and the CHIP8 emulator.
 */
import Chip8 from "./Chip8";
import { DomHandler } from "./DomHandler";

export class Application {
  TARGET_FPS = 1;
  CYCLES_PER_FRAME = 2;

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
    this.handleReset();
  }

  init = () => {
    // Make sure the speed dropdown is updated to the initial TARGET_FPS
    this.domHandler.updateSpeedSelector(this.TARGET_FPS);

    // Attach event listeners to DOM elements
    this.domHandler.attachListeners({
      onRomReadDone: (romBytes: Uint8Array) => {
        this.loopState.isRunning = false;
        this.chip8.reset();
        this.chip8.loadRom(romBytes);
        this.domHandler.updateMemoryDumpDom(this.chip8);
        this.domHandler.updateLedIndicator("alert");
        this.domHandler.disableLoadButton(true);
        this.domHandler.disableDomControlBtos(false);
      },
      onStartStopPress: () => {
        if (this.loopState.isRunning == false) {
          this.loopState.isRunning = true;
          this.domHandler.updateDomRegisters(this.chip8);
          this.domHandler.updateMemoryDumpDom(this.chip8);
          this.domHandler.renderVideoMemoryToCanva(this.chip8);
          this.domHandler.updateLedIndicator("on");
          this.domHandler.updateStartStopButton("STOP");
          this.domHandler.disableLoadButton(true);
          requestAnimationFrame(this.loop);
        } else {
          this.loopState.isRunning = false;
          this.domHandler.updateLedIndicator("halt");
          this.domHandler.updateStartStopButton("START");
          // this.domHandler.disableLoadButton(false);
        }
      },
      onCyclePress: () => {
        this.loopState.isRunning = false;
        this.chip8.cycle();
        this.domHandler.renderVideoMemoryToCanva(this.chip8);
        this.domHandler.updateDomRegisters(this.chip8);
        this.domHandler.updateMemoryDumpDom(this.chip8);
        this.domHandler.updateStartStopButton("START");
        this.domHandler.updateLedIndicator("halt");
      },
      onResetPress: () => {
        this.handleReset();
      },
      onSpeedDropdownChange: (newFPS: number) => {
        console.log(`FPS changed to: ${newFPS}`);
        this.TARGET_FPS = newFPS;
      },
    });

    // Init loop
    requestAnimationFrame(this.loop);
  };

  handleReset = () => {
    this.loopState.isRunning = false;
    this.chip8.reset();
    this.domHandler.renderVideoMemoryToCanva(this.chip8);
    this.domHandler.updateLedIndicator("off");
    this.domHandler.updateStartStopButton("START");
    this.domHandler.resetDomRegisters();
    this.domHandler.disableDomControlBtos(true);
    this.domHandler.disableLoadButton(false);
    this.domHandler.updateMemoryDumpDom(this.chip8);
  };

  loop = (currentTimestampMs: number) => {
    // Return if not running
    if (!this.loopState.isRunning) {
      return;
    }

    // First frame initialization
    if (!this.loopState.lastTimestampMs) {
      this.loopState.lastTimestampMs = currentTimestampMs;
      requestAnimationFrame(this.loop);
      return;
    }

    // Timing
    const dtMs = currentTimestampMs - this.loopState.lastTimestampMs;
    const FRAME_DELAY_TARGET_MS = 1000 / this.TARGET_FPS;
    if (dtMs < FRAME_DELAY_TARGET_MS) {
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

    // Update video memory to canvas
    this.domHandler.renderVideoMemoryToCanva(this.chip8);

    // Don't update dom register while cycling the chip8
    this.domHandler.updateDomRegisters(this.chip8);
    this.domHandler.updateMemoryDumpDom(this.chip8);

    // Grab led indicator state from the DOM if needed
    // this.domHandler.flipLedIndicator();

    // Request next frame
    if (this.loopState.isRunning) {
      requestAnimationFrame(this.loop);
    }
  };
}
