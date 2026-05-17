import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const srcFavicon = path.resolve('src/app/favicon.ico');

// Generate multiple sizes from the original favicon
async function generateIcons() {
  const input = fs.readFileSync(srcFavicon);
  
  // Create a 48x48 ICO-compatible PNG (for favicon)
  const favicon32 = await sharp(input)
    .resize(32, 32, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  const favicon48 = await sharp(input)
    .resize(48, 48, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
    
  // Create 192x192 PNG for PWA
  await sharp(input)
    .resize(192, 192, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile('public/icons/icon-192x192.png');
  console.log('✅ Created icon-192x192.png');

  // Create 512x512 PNG for PWA
  await sharp(input)
    .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile('public/icons/icon-512x512.png');
  console.log('✅ Created icon-512x512.png');

  // Build ICO file manually (simple ICO format with 32x32 and 48x48)
  // ICO header: 6 bytes
  // ICO entry: 16 bytes each
  const images = [favicon32, favicon48];
  const headerSize = 6;
  const entrySize = 16;
  const numImages = images.length;
  const sizes = [32, 48];
  
  let offset = headerSize + (entrySize * numImages);
  const entries = [];
  
  for (let i = 0; i < numImages; i++) {
    const size = sizes[i];
    const imgData = images[i];
    entries.push({ size, data: imgData, offset });
    offset += imgData.length;
  }
  
  const totalSize = offset;
  const ico = Buffer.alloc(totalSize);
  
  // ICO Header
  ico.writeUInt16LE(0, 0);      // Reserved
  ico.writeUInt16LE(1, 2);      // Type: 1 = ICO
  ico.writeUInt16LE(numImages, 4); // Number of images
  
  // ICO Directory Entries
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const pos = headerSize + (i * entrySize);
    ico.writeUInt8(entry.size === 256 ? 0 : entry.size, pos);     // Width
    ico.writeUInt8(entry.size === 256 ? 0 : entry.size, pos + 1); // Height
    ico.writeUInt8(0, pos + 2);         // Color palette
    ico.writeUInt8(0, pos + 3);         // Reserved
    ico.writeUInt16LE(1, pos + 4);      // Color planes
    ico.writeUInt16LE(32, pos + 6);     // Bits per pixel
    ico.writeUInt32LE(entry.data.length, pos + 8);  // Size of image data
    ico.writeUInt32LE(entry.offset, pos + 12);       // Offset to image data
  }
  
  // Image data
  for (const entry of entries) {
    entry.data.copy(ico, entry.offset);
  }
  
  // Write the new small favicon.ico to src/app (Next.js auto-serves this)
  fs.writeFileSync('src/app/favicon.ico', ico);
  console.log(`✅ Created favicon.ico (${(ico.length / 1024).toFixed(1)} KB, down from ${(input.length / 1024 / 1024).toFixed(1)} MB)`);
  
  // Also copy to public
  fs.writeFileSync('public/favicon.ico', ico);
  console.log('✅ Copied favicon.ico to public/');
}

generateIcons().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
