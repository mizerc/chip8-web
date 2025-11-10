export function getMnemonic(opcode: number) {
  const nibble3 = (opcode & 0xf000) >> 12;
  const nibble2 = (opcode & 0x0f00) >> 8;
  const nibble1 = (opcode & 0x00f0) >> 4;
  const nibble0 = opcode & 0x000f;
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
      mnemonic = "JP nnn";
      break;
    case 0x2:
      mnemonic = "CALL nnn";
      break;
    case 0x3:
      mnemonic = "SE Vx, byte";
      break;
    case 0x4:
      mnemonic = "SNE Vx, byte";
      break;
    case 0x5:
      mnemonic = "SE Vx, Vy";
      break;
    case 0x6:
      mnemonic = "LD Vx, byte";
      break;
    case 0x7:
      mnemonic = "ADD Vx, byte";
      break;
    case 0x8:
      switch (nibble0) {
        case 0x0:
          mnemonic = "LD Vx, Vy";
          break;
      }
      break;
    case 0x9:
      mnemonic = "SNE Vx, Vy";
      break;
    case 0xa:
      mnemonic = "LD I, address";
      break;
    case 0xb:
      mnemonic = "JP V0, nnn";
      break;
    case 0xc:
      mnemonic = "RND Vx, byte";
      break;
    case 0xd:
      // mnemonic = "DRW Vx, Vy, height";
      mnemonic = `DRW Vx=${nibble2}, Vy=${nibble1}, h=${nibble0}`;
      break;
    case 0xe:
      switch (nibble0) {
        case 0x9e:
          mnemonic = "SKP Vx";
          break;
      }
      break;
    case 0xf:
      switch (nibble0) {
        case 0x07:
          mnemonic = "LD Vx, DT";
          break;
      }
      break;
  }
  return mnemonic;
}
