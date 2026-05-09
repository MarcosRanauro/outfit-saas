const sharp = require('sharp')
const path = require('path')
const fs = require('fs')

const input = path.join(__dirname, '../public/logos-mia-ai/mia-outfit-ai.png')
const outDir = path.join(__dirname, '../public/favicon')

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })

const sizes = [16, 32, 48, 64, 128, 180, 192, 512]

async function generate() {
  for (const size of sizes) {
    await sharp(input)
      .resize(size, size, { fit: 'contain', background: { r: 8, g: 8, b: 8, alpha: 1 } })
      .png()
      .toFile(path.join(outDir, `favicon-${size}x${size}.png`))
    console.log(`✓ favicon-${size}x${size}.png`)
  }

  await sharp(input)
    .resize(180, 180, { fit: 'contain', background: { r: 8, g: 8, b: 8, alpha: 1 } })
    .png()
    .toFile(path.join(outDir, 'apple-touch-icon.png'))
  console.log('✓ apple-touch-icon.png')
}

generate()
