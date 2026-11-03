import sharp from 'sharp'
import { readdir, stat, rename } from 'node:fs/promises'
import path from 'node:path'

const dir = 'public/images'
for (const f of await readdir(dir)) {
  if (!/\.(jpe?g|png)$/i.test(f)) continue
  const src = path.join(dir, f)
  const before = (await stat(src)).size
  if (before < 250 * 1024) continue
  const tmp = src + '.tmp'
  const img = sharp(src).rotate().resize({ width: 1920, withoutEnlargement: true })
  await (/\.png$/i.test(f) ? img.png({ compressionLevel: 9 }) : img.jpeg({ quality: 78, mozjpeg: true })).toFile(tmp)
  const after = (await stat(tmp)).size
  if (after < before) {
    await rename(tmp, src)
    console.log(f, (before / 1e6).toFixed(1) + 'MB ->', (after / 1e6).toFixed(1) + 'MB')
  }
}