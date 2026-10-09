import fs from 'fs';
import zlib from 'zlib';

function decodePng(filePath) {
  const buf = fs.readFileSync(filePath);
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  
  let pos = 8;
  const idatChunks = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    if (type === 'IDAT') {
      idatChunks.push(buf.subarray(pos + 8, pos + 8 + len));
    }
    pos += 12 + len;
  }
  
  const decompressed = zlib.inflateSync(Buffer.concat(idatChunks));
  const bytesPerPixel = 4;
  const stride = 1 + width * bytesPerPixel;
  
  // Unfilter scanlines
  const pixels = new Uint8Array(width * height * 4);
  const prevRow = new Uint8Array(width * 4);
  
  for (let y = 0; y < height; y++) {
    const filter = decompressed[y * stride];
    const rowStart = y * stride + 1;
    const destOffset = y * width * 4;
    
    for (let x = 0; x < width * 4; x++) {
      const raw = decompressed[rowStart + x];
      const a = x >= 4 ? pixels[destOffset + x - 4] : 0;
      const b = prevRow[x];
      const c = x >= 4 ? prevRow[x - 4] : 0;
      
      let val = raw;
      if (filter === 1) val = (raw + a) & 0xff; // Sub
      else if (filter === 2) val = (raw + b) & 0xff; // Up
      else if (filter === 3) val = (raw + Math.floor((a + b) / 2)) & 0xff; // Average
      else if (filter === 4) { // Paeth
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        const pr = (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c);
        val = (raw + pr) & 0xff;
      }
      
      pixels[destOffset + x] = val;
      prevRow[x] = val;
    }
  }
  
  return { width, height, pixels };
}

// Encode uncompressed PNG
function encodePng(width, height, rgba) {
  // Simple PNG encoder
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  
  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8-bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0; // Deflate
  ihdr[11] = 0; // Filter
  ihdr[12] = 0; // No interlace
  
  function makeChunk(type, data) {
    const len = data.length;
    const buf = Buffer.alloc(12 + len);
    buf.writeUInt32BE(len, 0);
    buf.write(type, 4, 4, 'ascii');
    data.copy(buf, 8);
    // CRC32
    const crc = crc32(buf.subarray(4, 8 + len));
    buf.writeInt32BE(crc, 8 + len);
    return buf;
  }
  
  // Raw scanlines with filter byte 0 (None)
  const rawData = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    const rowOffset = y * (1 + width * 4);
    rawData[rowOffset] = 0; // filter None
    rgba.copy(rawData, rowOffset + 1, y * width * 4, (y + 1) * width * 4);
  }
  
  const idatData = zlib.deflateSync(rawData);
  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', idatData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));
  
  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// CRC32 table
const crcTable = new Int32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return c ^ -1;
}

console.log('Decoding front.png...');
const front = decodePng('public/references/front.png');
console.log('Decoding back.png...');
const back = decodePng('public/references/back.png');

console.log('Building 1024x1024 atlas...');
const atlasW = 1024;
const atlasH = 1024;
const atlasPixels = Buffer.alloc(atlasW * atlasH * 4);

// Crop rectangle for character
const cropX = 360;
const cropW = 304;
const cropY = 24;
const cropH = 516;

// Left half (0..511): Front
for (let dy = 0; dy < atlasH; dy++) {
  const sy = Math.floor(cropY + (dy / atlasH) * cropH);
  for (let dx = 0; dx < 512; dx++) {
    const sx = Math.floor(cropX + (dx / 512) * cropW);
    const srcIdx = (sy * front.width + sx) * 4;
    const dstIdx = (dy * atlasW + dx) * 4;
    
    atlasPixels[dstIdx] = front.pixels[srcIdx];
    atlasPixels[dstIdx + 1] = front.pixels[srcIdx + 1];
    atlasPixels[dstIdx + 2] = front.pixels[srcIdx + 2];
    atlasPixels[dstIdx + 3] = front.pixels[srcIdx + 3];
  }
}

// Right half (512..1023): Back
for (let dy = 0; dy < atlasH; dy++) {
  const sy = Math.floor(cropY + (dy / atlasH) * cropH);
  for (let dx = 0; dx < 512; dx++) {
    const sx = Math.floor(cropX + (dx / 512) * cropW);
    const srcIdx = (sy * back.width + sx) * 4;
    const dstIdx = (dy * atlasW + 512 + dx) * 4;
    
    atlasPixels[dstIdx] = back.pixels[srcIdx];
    atlasPixels[dstIdx + 1] = back.pixels[srcIdx + 1];
    atlasPixels[dstIdx + 2] = back.pixels[srcIdx + 2];
    atlasPixels[dstIdx + 3] = back.pixels[srcIdx + 3];
  }
}

if (!fs.existsSync('public/textures')) {
  fs.mkdirSync('public/textures', { recursive: true });
}

const outPng = encodePng(atlasW, atlasH, atlasPixels);
fs.writeFileSync('public/textures/character_atlas.png', outPng);
console.log('Saved public/textures/character_atlas.png (' + outPng.length + ' bytes)');
