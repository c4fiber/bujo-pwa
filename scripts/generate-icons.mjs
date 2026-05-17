import sharp from 'sharp'
import { mkdirSync } from 'fs'

mkdirSync('public/icons', { recursive: true })

const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="102" fill="#0f0f0f"/>
  <circle cx="256" cy="256" r="96" fill="#e4e4e7"/>
  <circle cx="256" cy="256" r="48" fill="#0f0f0f"/>
</svg>`)

for (const size of [72, 96, 128, 144, 152, 192, 384, 512]) {
  await sharp(svg).resize(size).png().toFile(`public/icons/icon-${size}.png`)
  console.log(`  icon-${size}.png`)
}
console.log('Done')
