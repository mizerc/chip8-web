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
  }

  init = () => {
    // Make sure the speed dropdown is updated to the initial TARGET_FPS
    this.domHandler.updateSpeedSelector(this.TARGET_FPS);

    // Attach event listeners to DOM elements
    this.domHandler.attachListeners({
      onSpeedDropdownChange: (newFPS: number) => {
        console.log(`FPS changed to: ${newFPS}`);
        this.TARGET_FPS = newFPS;
      },
      onRomReadDone: (romBytes: Uint8Array) => {
        this.domHandler.updateLedIndicator("halt");
        this.loopState.isRunning = false;
        this.chip8.reset();
        this.chip8.loadRom(romBytes);
        this.domHandler.updateMemoryViewDom(this.chip8);
      },
      onResetPress: () => {
        this.domHandler.updateLedIndicator("off");
        this.loopState.isRunning = false;
        this.chip8.reset();
        this.domHandler.resetRegisters();
        this.domHandler.updateMemoryViewDom(this.chip8);
      },
      onRunPress: () => {
        this.domHandler.updateRegisters(this.chip8);
        this.domHandler.updateMemoryViewDom(this.chip8);
        this.domHandler.renderVideoMemoryToCanva(this.chip8);
        this.domHandler.updateLedIndicator("on");
        this.loopState.isRunning = true;
        requestAnimationFrame(this.loop);
      },
      onPausePress: () => {
        this.loopState.isRunning = false;
        this.domHandler.updateLedIndicator("halt");
      },
      onCyclePress: () => {
        this.loopState.isRunning = false;
        this.domHandler.updateMemoryViewDom(this.chip8);
        this.chip8.cycle();
        this.domHandler.updateRegisters(this.chip8);
        this.domHandler.renderVideoMemoryToCanva(this.chip8);
      },
    });

    // Init loop
    requestAnimationFrame(this.loop);
  };

  loop = (currentTimestampMs: number) => {
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

    // Grab led indicator state from the DOM if needed
    this.domHandler.flipLedIndicator();

    // Update input state
    this.chip8.updateKeyboardMemory(this.domHandler.keyboardState);

    // Cycle chip8
    for (let i = 0; i < this.CYCLES_PER_FRAME; i++) {
      this.chip8.cycle();
    }

    // Don't update dom register while cycling the chip8
    this.domHandler.updateRegisters(this.chip8);
    // updateMemoryView();

    // Update video memory to canvas
    this.domHandler.renderVideoMemoryToCanva(this.chip8);

    // Request next frame
    if (this.loopState.isRunning) {
      requestAnimationFrame(this.loop);
    }
  };
}
