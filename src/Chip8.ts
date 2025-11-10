import { FONTSET } from "./Fontset";
import { getMnemonic } from "./utils";

class Chip8 {
  static VIDEO_W: number = 64;
  static VIDEO_H: number = 32;
  static MEMORY_SIZE: number = 4096;
  static KEYPAD_SIZE: number = 16;
  static START_ADDRESS: number = 0x200;
  static FONTSET_START_ADDRESS: number = 0x50;
  static NIBBLE_3_MASK: number = 0xf000;
  static NIBBLE_2_MASK: number = 0x0f00;
  static NIBBLE_1_MASK: number = 0x00f0;
  static NIBBLE_0_MASK: number = 0x000f;
  static ARG_0NNN_MASK: number = 0x0fff;
  static ARG_0XNN_MASK: number = 0x0f00;
  static BYTES_PER_CHAR: number = 5;
  memory: Uint8Array;
  keypadMemory: Uint8Array;
  videoMemory: Uint8Array;
  stackMemory: Uint16Array;
  R_PC: number;
  R_SP: number;
  R_I: number;
  REG: Uint8Array;
  OPCODE: number;
  R_AUDIO_TIMER: number;
  R_DELAY_TIMER: number;
  constructor() {
    this.memory = new Uint8Array(Chip8.MEMORY_SIZE);
    this.keypadMemory = new Uint8Array(Chip8.KEYPAD_SIZE);
    this.videoMemory = new Uint8Array(Chip8.VIDEO_W * Chip8.VIDEO_H);
    this.stackMemory = new Uint16Array(16);
    this.copyFontset();
    this.R_PC = Chip8.START_ADDRESS;
    this.REG = new Uint8Array(16);
    this.R_SP = 0;
    this.R_I = 0;
    this.OPCODE = 0;
    this.R_AUDIO_TIMER = 0;
    this.R_DELAY_TIMER = 0;
  }
  copyFontset() {
    console.log("Copying Fontset");
    FONTSET.forEach((byte, index) => {
      this.memory[Chip8.FONTSET_START_ADDRESS + index] = byte;
    });
  }
  reset() {
    console.log("Resetting Chip8");
    this.memory.fill(0);
    this.keypadMemory.fill(0);
    this.videoMemory.fill(0);
    this.stackMemory.fill(0);
    this.copyFontset();
    this.OPCODE = 0;
    this.REG.fill(0);
    this.R_AUDIO_TIMER = 0;
    this.R_DELAY_TIMER = 0;
    this.R_PC = Chip8.START_ADDRESS;
    this.R_I = 0;
    this.R_SP = 0;
  }
  loadRom(romBytes: Uint8Array) {
    console.log("Loading ROM");
    console.log("romBytes", romBytes);
    romBytes.forEach((byte, index) => {
      this.memory[Chip8.START_ADDRESS + index] = byte;
      console.log(
        "memory",
        Chip8.START_ADDRESS + index,
        "Hex: " + (Chip8.START_ADDRESS + index).toString(16),
        "Value: " + byte.toString(16)
      );
    });
  }
  cycle() {
    // Fetch opcode
    // Fetch 2 bytes from memory in Big-endian order
    // Big endian means high byte first or at lower address
    // [ 1 byte ]     [ 1 byte ]
    // [ addr 0x200 ] [ addr 0x201 ]
    // [ high byte ]  [ low byte ]
    // Number is 32 bits in js
    const highByte = this.memory[this.R_PC];
    const lowByte = this.memory[this.R_PC + 1];
    // Mask to 16 bits
    this.OPCODE = ((highByte << 8) | lowByte) & 0x0000ffff;

    const opStr = this.OPCODE.toString(16).padStart(4, "0").toUpperCase();
    const rPcStr = this.R_PC.toString(16).padStart(4, "0").toUpperCase();
    console.log(`${rPcStr}: ${opStr} ${getMnemonic(this.OPCODE)}`);
    // console.log("OPCODE", this.OPCODE);
    // console.log("R_PC", this.R_PC, "Hex: " + this.R_PC.toString(16));
    // console.log("memory", this.memory[this.R_PC]);
    // console.log("memory", this.memory[this.R_PC + 1]);

    // Increment program counter
    this.R_PC += 2;

    // Decode opcode
    // 0xABCD => 2 bytes => 1 byte = 0xAB, 1 byte = 0xCD
    // [ 1 byte ][ 1 byte ]
    // [ 4 bits  ][ 4 bits  ][ 4 bits  ][ 4 bits  ]
    // [ nibble3 ][ nibble2 ][ nibble1 ][ nibble0 ]
    const nibble0 = this.OPCODE & Chip8.NIBBLE_0_MASK;
    // const nibble1 = (this.OPCODE & 0x00f0) >> 4;
    // const nibble2 = (this.OPCODE & 0x0f00) >> 8;
    const nibble3 = (this.OPCODE & Chip8.NIBBLE_3_MASK) >> 12;
    const lowByteFromOpcode = this.OPCODE & 0x00ff;

    // Execute opcode
    switch (nibble3) {
      case 0x0:
        switch (nibble0) {
          case 0x0: // 0x00E0
            this.OP_00E0();
            break;
          case 0xe: // 0x00EE
            this.OP_00EE();
            break;
        }
        break;
      case 1:
        this.OP_1nnn();
        break;
      case 2:
        this.OP_2nnn();
        break;
      case 3:
        this.OP_3xkk();
        break;
      case 4:
        this.OP_4xkk();
        break;
      case 5:
        this.OP_5xy0();
        break;
      case 6:
        this.OP_6xkk();
        break;
      case 7:
        this.OP_7xkk();
        break;
      case 8:
        switch (nibble0) {
          case 0x0:
            this.OP_8xy0();
            break;
          case 0x1:
            this.OP_8xy1();
            break;
          case 0x2:
            this.OP_8xy2();
            break;
          case 0x3:
            this.OP_8xy3();
            break;
          case 0x4:
            this.OP_8xy4();
            break;
          case 0x5:
            this.OP_8xy5();
            break;
          case 0x6:
            this.OP_8xy6();
            break;
          case 0x7:
            this.OP_8xy7();
            break;
          case 0xe:
            this.OP_8xyE();
            break;
        }
        break;
      case 9:
        this.OP_9xy0();
        break;
      case 0xa:
        this.OP_Annn();
        break;
      case 0xb:
        this.OP_Bnnn();
        break;
      case 0xc:
        this.OP_Cxkk();
        break;
      case 0xd:
        this.OP_Dxyn();
        break;
      case 0xe:
        switch (nibble0) {
          case 0x9e:
            this.OP_Ex9E();
            break;
          case 0xa1:
            this.OP_ExA1();
            break;
        }
        break;
      case 0xf:
        switch (lowByteFromOpcode) {
          case 0x07:
            this.OP_Fx07();
            break;
          case 0x0a:
            this.OP_Fx0A();
            break;
          case 0x15:
            this.OP_Fx15();
            break;
          case 0x18:
            this.OP_Fx18();
            break;
          case 0x1e:
            this.OP_Fx1E();
            break;
          case 0x29:
            this.OP_Fx29();
            break;
          case 0x33:
            this.OP_Fx33();
            break;
          case 0x55:
            this.OP_Fx55();
            break;
          case 0x65:
            this.OP_Fx65();
            break;
        }
        break;
    }

    // Update timers
    if (this.R_DELAY_TIMER > 0) {
      this.R_DELAY_TIMER--;
    }
    if (this.R_AUDIO_TIMER > 0) {
      this.R_AUDIO_TIMER--;
    }
  }
  // ================================
  // = SUBHANDLERS
  // ================================
  // ================================
  // = OPCODES
  // ================================
  DO_NOTHING() {
    // No operation
  }
  OP_00E0() {
    // CLS
    // No arguments
    // Clear the video memory with zeros
    this.videoMemory.fill(0);
  }
  OP_00EE() {
    // RET
    // No arguments
    // Pop the last address from the stack and set the PC to it
    this.R_SP--;
    this.R_PC = this.stackMemory[this.R_SP];
  }
  OP_1nnn() {
    // JP address
    // Address: nnn (12 bits)
    // Jump to address nnn
    const address = this.OPCODE & Chip8.ARG_0NNN_MASK;
    this.R_PC = address;
  }
  OP_2nnn() {
    // CALL nnn
    // Address: nnn (12 bits)
    // Call subroutine at nnn
    // Push current PC to stack and set PC to nnn
    const address = this.OPCODE & Chip8.ARG_0NNN_MASK;
    this.stackMemory[this.R_SP] = this.R_PC;
    this.R_SP++;
    this.R_PC = address;
  }
  OP_3xkk() {
    // skip if VX == NN
    // Vx: (4 bits) X = values 0-F
    // Byte: kk (8 bits)
    // If Vx == kk, increment PC by 2
    // 	Opcode = 0xABCD
    // 0xABCD & 0x0F00 = 0x0B00
    // 0x0B00 >> 8u = 0x0B
    const Vx = (this.OPCODE & 0x0f00) >> 8;
    const byte = this.OPCODE & 0x00ff;
    if (this.REG[Vx] == byte) {
      this.R_PC += 2;
    }
  }
  OP_4xkk() {
    // skip if VX != NN
    // Vx: (4 bits) X = values 0-F
    // Byte: kk (8 bits)
    // If Vx != kk, increment PC by 2
    const Vx = (this.OPCODE & 0x0f00) >> 8;
    const byte = this.OPCODE & 0x00ff;
    if (this.REG[Vx] != byte) {
      this.R_PC += 2;
    }
  }
  OP_5xy0() {
    // skip if VX == VY
    // Vx: (4 bits) X = values 0-F
    // Vy: (4 bits) Y = values 0-F
    // If Vx == Vy, increment PC by 2
    const Vx = (this.OPCODE & 0x0f00) >> 8;
    const Vy = (this.OPCODE & 0x00f0) >> 4;
    if (this.REG[Vx] == this.REG[Vy]) {
      this.R_PC += 2;
    }
  }
  OP_6xkk() {
    // LD Vx, byte
    // LOAD byte kk into register Vx
    const Vx = (this.OPCODE & 0x0f00) >> 8;
    const byte = this.OPCODE & 0x00ff;
    this.REG[Vx] = byte & 0xff;
  }
  OP_7xkk() {
    // ADD Vx, byte
    // Set Vx = Vx + kk
    const Vx = (this.OPCODE & 0x0f00) >> 8;
    const byte = this.OPCODE & 0x00ff;
    // Mask js 64 bits number to 8 bits, must wrap at 255+1
    this.REG[Vx] = (this.REG[Vx] + byte) & 0xff;
  }
  OP_8xy0() {
    // LD Vx, Vy, aka, Vx <= Vy
    // This copies the value in register Vy into register Vx.
    // The flag register VF is not affected.
    const Vx = (this.OPCODE & 0x0f00) >> 8;
    const Vy = (this.OPCODE & 0x00f0) >> 4;
    this.REG[Vx] = this.REG[Vy];
  }
  OP_8xy1() {
    // OR Vx, Vy
    // 8XY1 performs a bitwise OR between two REG.
    const Vx = (this.OPCODE & 0x0f00) >> 8;
    const Vy = (this.OPCODE & 0x00f0) >> 4;
    this.REG[Vx] |= this.REG[Vy];
  }
  OP_8xy2() {
    // AND Vx, Vy
    // 8XY2 performs a bitwise AND between two REG.
    const Vx = (this.OPCODE & 0x0f00) >> 8;
    const Vy = (this.OPCODE & 0x00f0) >> 4;
    this.REG[Vx] &= this.REG[Vy];
  }
  OP_8xy3() {
    // XOR Vx, Vy
    // 8XY3 performs a bitwise XOR between two REG.
    const Vx = (this.OPCODE & 0x0f00) >> 8;
    const Vy = (this.OPCODE & 0x00f0) >> 4;
    this.REG[Vx] ^= this.REG[Vy];
  }
  OP_8xy4() {
    // ADD Vx, Vy
    // ADD WITH CARRY
    // Set Vx = Vx + Vy
    // set VF = carry
    const Vx = (this.OPCODE & 0x0f00) >> 8;
    const Vy = (this.OPCODE & 0x00f0) >> 4;
    const sum = this.REG[Vx] + this.REG[Vy];
    // Set carry flag
    if (sum > 255) {
      this.REG[0xf] = 1;
    } else {
      this.REG[0xf] = 0;
    }
    this.REG[Vx] = sum & 0xff;
  }
  OP_8xy5() {
    // SUB Vx, Vy
    // SUB WITH BORROW
    // Subtract VY from VX
    // Set Vx = Vx - Vy
    // set VF = NOT borrow
    const Vx = (this.OPCODE & 0x0f00) >> 8;
    const Vy = (this.OPCODE & 0x00f0) >> 4;
    if (this.REG[Vx] > this.REG[Vy]) {
      // No need to borrow
      this.REG[0xf] = 1;
    } else {
      // Need to borrow
      this.REG[0xf] = 0;
    }
    this.REG[Vx] -= this.REG[Vy];
  }
  OP_8xy6() {
    // SHR Vx, Vy
    // SHIFT RIGHT BY ONE
    // the value in Vy is shifted right by 1.
    // Set Vx = Vx SHR 1
    // VF is set to the least significant bit of Vx before the shift.
    const Vx = (this.OPCODE & 0x0f00) >> 8;
    // Save LSB in VF
    this.REG[0xf] = this.REG[Vx] & 0x0001;
    this.REG[Vx] = this.REG[Vx] >> 1;
  }
  OP_8xy7() {
    // SUBN Vx, Vy
    // REVERSE SUBTRACT WITH BORROW
    // Subtract VX from VY and store the result in VX
    // Set Vx = Vy - Vx
    // set VF = NOT borrow
    const Vx = (this.OPCODE & 0x0f00) >> 8;
    const Vy = (this.OPCODE & 0x00f0) >> 4;
    // If no borrow, set VF to 1
    // Has borrow if Vx >= Vy
    // 20 − 20 = 0 => No borrow → VF = 1
    if (this.REG[Vy] >= this.REG[Vx]) {
      this.REG[0xf] = 1;
    } else {
      this.REG[0xf] = 0;
    }
    this.REG[Vx] = this.REG[Vy] - this.REG[Vx];
  }
  OP_8xyE() {
    // SHL Vx
    // SHIFT LEFT BY ONE
    // the value in Vx is shifted left by 1.
    // VF = MSB (bit 7) of Vy before the shift
    const Vx = (this.OPCODE & 0x0f00) >> 8;
    const bit7 = (this.REG[Vx] & 0b10000000) >> 7;
    this.REG[0xf] = bit7;
    this.REG[Vx] <<= 1;
  }
  OP_9xy0() {
    // skip if VX != VY
    // Vx: (4 bits) X = values 0-F
    // Vy: (4 bits) Y = values 0-F
    const Vx = (this.OPCODE & 0x0f00) >> 8;
    const Vy = (this.OPCODE & 0x00f0) >> 4;
    if (this.REG[Vx] != this.REG[Vy]) {
      this.R_PC += 2;
    }
  }
  OP_Annn() {
    // LD I, address
    // Load the value of address nnn into the index register
    // Address: nnn (12 bits)
    // Set index register = nnn
    const address = this.OPCODE & 0x0fff;
    this.R_I = address;
  }
  OP_Bnnn() {
    // Jump to NNN + V0
    // Address: nnn (12 bits)
    // Jump to address nnn + V0
    // Set PC to V0 + nnn
    const address = this.OPCODE & 0x0fff;
    this.R_PC = this.REG[0] + address;
  }
  OP_Cxkk() {
    // RND Vx, byte
    // VX = rand() & NN
    // Set Vx = random byte AND kk
    // Vx: (4 bits) X = values 0-F
    const Vx = (this.OPCODE & 0x0f00) >> 8;
    const byte = this.OPCODE & 0x00ff;
    this.REG[Vx] = this.getRandomByte() & byte;
  }
  OP_Dxyn() {
    // DRW Vx, Vy, height
    // Drawing sprites to the screen
    // Reads N bytes from memory starting at I.
    // Draw N-byte sprite at (VX, VY), set VF on collision

    // Vx: (4 bits) X = values 0-F
    const Vx = (this.OPCODE & 0x0f00) >> 8;
    // Vy: (4 bits) Y = values 0-F
    const Vy = (this.OPCODE & 0x00f0) >> 4;
    // Height: n (4 bits)
    const numRows = this.OPCODE & 0x000f;

    // Reset VF to check for collisions
    this.REG[0xf] = 0;

    // Wrap around screen coordinates
    const startX = this.REG[Vx] % Chip8.VIDEO_W;
    const startY = this.REG[Vy] % Chip8.VIDEO_H;
    for (let spriteRow = 0; spriteRow < numRows; ++spriteRow) {
      const spriteByte = this.memory[this.R_I + spriteRow];
      for (let bitPos = 0; bitPos < 8; bitPos++) {
        const spritePixel = spriteByte & (0b10000000 >> bitPos);
        const pixelX = (startX + bitPos) % Chip8.VIDEO_W;
        const pixelY = (startY + spriteRow) % Chip8.VIDEO_H;

        const videoMemoryIndex = pixelY * Chip8.VIDEO_W + pixelX;
        if (spritePixel) {
          if (this.videoMemory[videoMemoryIndex] === 1) {
            // Collision detected
            this.REG[0xf] = 1;
          }
          // Always XOR the pixel
          this.videoMemory[videoMemoryIndex] ^= 1;
        }
      }
    }
  }
  OP_Ex9E() {
    // SKP Vx
    // skip if key VX pressed
    // If the key stored in VX is pressed, skip the next instruction
    const Vx = (this.OPCODE & 0x0f00) >> 8;
    const key = this.REG[Vx];
    if (this.keypadMemory[key]) {
      this.R_PC += 2;
    }
  }
  OP_ExA1() {
    // SKNP Vx
    // skip if key VX not pressed
    // If the key stored in VX is not pressed, skip the next instruction
    const Vx = (this.OPCODE & 0x0f00) >> 8;
    const key = this.REG[Vx];
    if (!this.keypadMemory[key]) {
      this.R_PC += 2;
    }
  }
  OP_Fx0A() {
    // LD Vx, K
    // Wait for a key press, store the value of the key in Vx
    // Block until a key is pressed, store the value of the key in Vx
    const Vx = (this.OPCODE & 0x0f00) >> 8;
    let keyFound = false;
    for (let k = 0; k < 16; k++) {
      if (this.keypadMemory[k]) {
        this.REG[Vx] = k;
        keyFound = true;
        break;
      }
    }
    // Repeat this instruction by preventing PC from advancing
    if (!keyFound) {
      this.R_PC -= 2;
    }
  }
  OP_Fx07() {
    // LD Vx, DT
    // Set Vx to the value of the delay timer
    const Vx = (this.OPCODE & 0x0f00) >> 8;
    this.REG[Vx] = this.R_DELAY_TIMER;
  }
  OP_Fx15() {
    // LD DT, Vx
    // Set delay timer = Vx
    const Vx = (this.OPCODE & 0x0f00) >> 8;
    this.R_DELAY_TIMER = this.REG[Vx];
  }
  OP_Fx18() {
    // LD ST, Vx
    // Set the audio timer to the value of the register Vx
    const Vx = (this.OPCODE & 0x0f00) >> 8;
    this.R_AUDIO_TIMER = this.REG[Vx];
  }
  OP_Fx1E() {
    // ADD I, Vx
    // Add the value of register Vx to register I
    const Vx = (this.OPCODE & 0x0f00) >> 8;
    this.R_I += this.REG[Vx];
  }
  OP_Fx29() {
    // LD F, Vx
    // Set I = location of FONT_SPRITE for digit Vx
    const Vx = (this.OPCODE & 0x0f00) >> 8;
    const digit = this.REG[Vx];
    this.R_I = Chip8.FONTSET_START_ADDRESS + Chip8.BYTES_PER_CHAR * digit;
  }
  OP_Fx33() {
    // LD BCD, Vx
    // Store BCD representation of Vx in memory locations I, I+1, and I+2
    // This converts the value in Vx (0–255) into three decimal digits
    // So the value is stored as decimal digits, not ASCII, not binary.
    const Vx = (this.OPCODE & 0x0f00) >> 8;
    const value = this.REG[Vx];

    // If Vx = 254 and I = 300
    // memory[300] = 2 (2 x 100)
    // memory[301] = 5 (5 x 10)
    // memory[302] = 4 (4 x 1)

    this.memory[this.R_I + 0] = value / 100;
    this.memory[this.R_I + 1] = (value / 10) % 10;
    this.memory[this.R_I + 2] = value % 10;
  }
  OP_Fx55() {
    // Store REG V0 through Vx into memory starting at I
    const Vx = (this.OPCODE & 0x0f00) >> 8;
    for (let w = 0; w <= Vx; ++w) {
      this.memory[this.R_I + w] = this.REG[w];
    }
  }
  OP_Fx65() {
    // 0xF265, 0xF365, ...
    // Load REG V0 through Vx from memory starting at I
    const Vx = (this.OPCODE & 0x0f00) >> 8;
    for (let w = 0; w <= Vx; ++w) {
      this.REG[w] = this.memory[this.R_I + w];
    }
  }
  getRandomByte() {
    // Return a random byte between 0 and 255
    return Math.floor(Math.random() * 256);
  }
}

export default Chip8;
