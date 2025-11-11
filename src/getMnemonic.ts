export function getMnemonic(opcode: number) {
  const nibble3 = (opcode & 0xf000) >> 12;
  const nibble2 = (opcode & 0x0f00) >> 8;
  const nibble1 = (opcode & 0x00f0) >> 4;
  const nibble0 = opcode & 0x000f;
  const lowByte = opcode & 0x00ff;
  // 0xABCD
  // [A]      [B]      [C]      [D]
  // [nibble3][nibble2][nibble1][nibble0]
  let mnemonic = "";
  switch (nibble3) {
    case 0x0:
      switch (nibble0) {
        case 0x0:
          mnemonic = "CLS";
          break;
        case 0xe:
          mnemonic = "RET";
          break;
      }
      break;
    case 0x1:
      mnemonic = `1) JP nnn (0x${(opcode & 0x0FFF).toString(16).toUpperCase().padStart(3, "0")})`;
      break;
    case 0x2:
      mnemonic = "2) CALL nnn";
      break;
    case 0x3:
      mnemonic = "3) SE Vx, byte";
      break;
    case 0x4:
      mnemonic = "4) SNE Vx, byte";
      break;
    case 0x5:
      mnemonic = "5) SE Vx, Vy";
      break;
    case 0x6:
      mnemonic = `6) LD Vx, byte (Vx=${nibble2}, byte=${(opcode & 0x00FF).toString(16).toUpperCase().padStart(2, "0")})`;
      break;
    case 0x7:
      mnemonic = `7) ADD Vx, byte (0x${(opcode & 0x00FF).toString(16).toUpperCase().padStart(2, "0")})`;
      break;
    case 0x8:
      switch (nibble0) {
        case 0x0:
          mnemonic = `80) LD Vx, Vy (Vx=${nibble2}, Vy=${nibble1})`;
          break;
      }
      break;
    case 0x9:
      mnemonic = `9)SNE Vx, Vy (Vx=${nibble2}, Vy=${nibble1})`;
      break;
    case 0xa:
      mnemonic = `A) LD I, address (I=${(opcode & 0x0FFF).toString(16).toUpperCase().padStart(3, "0")})`;
      break;
    case 0xb:
      mnemonic = `B) JP V0, nnn (PC=${(opcode & 0x0FFF).toString(16).toUpperCase().padStart(3, "0")} = 0x${(opcode & 0x0FFF).toString(16).toUpperCase().padStart(3, "0")})`;
      break;
    case 0xc:
      mnemonic = `C) RND Vx, byte (Vx=${nibble2}, byte=${(opcode & 0x00FF).toString(16).toUpperCase().padStart(2, "0")} = 0x${(opcode & 0x00FF).toString(16).toUpperCase().padStart(2, "0")})`;
      break;
    case 0xd:
      // mnemonic = "DRW Vx, Vy, height";
      mnemonic = `D)DRW Vx=${nibble2}, Vy=${nibble1}, h=${nibble0}`;
      break;
    case 0xe:
      switch (lowByte) {
        case 0x9E:
          mnemonic = "E9e) SKP Vx";
          break;
      }
      break;
    case 0xf:
      switch (nibble0) {
        case 0x07:
          mnemonic = "F07) LD Vx, DT";
          break;
      }
      break;
  }
  return mnemonic;
}
