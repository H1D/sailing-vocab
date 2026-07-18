// Real end-to-end check that Train progress + "removed" cards actually persist
// to localStorage in a real browser, and survive a reload. Drives the BUILT app
// (vite preview on :5199) via system chromium. No fabricated results — every
// assertion reads back what the running app wrote.
import puppeteer from 'puppeteer-core'

const URL = 'http://localhost:5199/#flashcards'
const CHROME = '/usr/bin/chromium-browser'
const results = []
function check(name, pass, detail) {
  results.push({ name, pass, detail })
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`)
}

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
})

try {
  const page = await browser.newPage()
  await page.emulateMediaFeatures([]) // no-op, keep default
  await page.goto(URL, { waitUntil: 'networkidle0' })

  // start clean
  await page.evaluate(() => localStorage.clear())
  await page.reload({ waitUntil: 'networkidle0' })

  const clickByText = (txt) =>
    page.evaluate((t) => {
      const b = [...document.querySelectorAll('button')].find((el) =>
        el.textContent.trim().includes(t),
      )
      if (!b) return false
      b.click()
      return true
    }, txt)

  const getLS = (key) =>
    page.evaluate((k) => localStorage.getItem(k), key)

  // Wait for the Train view to render a Reveal button
  await page.waitForFunction(
    () => [...document.querySelectorAll('button')].some((b) => b.textContent.includes('Reveal')),
    { timeout: 10000 },
  )

  // ---- Test 1: answering a card writes leitner-state ----
  await clickByText('Reveal')
  await page.waitForFunction(
    () => [...document.querySelectorAll('button')].some((b) => b.textContent.includes('Got it')),
    { timeout: 5000 },
  )
  const gotIt = await clickByText('Got it')
  await new Promise((r) => setTimeout(r, 300))
  const stateRaw = await getLS('leitner-state')
  let stateOk = false
  let firstEntry = null
  try {
    const s = JSON.parse(stateRaw || '{}')
    const keys = Object.keys(s)
    if (keys.length >= 1) {
      firstEntry = s[keys[0]]
      stateOk =
        typeof firstEntry.box === 'number' &&
        typeof firstEntry.nextReview === 'string' &&
        typeof firstEntry.streak === 'number'
    }
  } catch { /* stateOk stays false */ }
  check('answer "Got it" persists to leitner-state', gotIt && stateOk, `entry=${JSON.stringify(firstEntry)}`)

  // ---- Test 2: state survives a full reload ----
  const before = await getLS('leitner-state')
  await page.reload({ waitUntil: 'networkidle0' })
  const after = await getLS('leitner-state')
  check('leitner-state survives reload', !!after && after === before, `${Object.keys(JSON.parse(after || '{}')).length} entr(y/ies) after reload`)

  // ---- Test 3: hold-to-remove writes leitner-suspended ----
  await page.waitForFunction(
    () => [...document.querySelectorAll('button')].some((b) => b.textContent.includes('Reveal')),
    { timeout: 5000 },
  )
  await clickByText('Reveal')
  await page.waitForFunction(
    () => [...document.querySelectorAll('button')].some((b) => (b.getAttribute('aria-label') || '').includes('Hold to remove')),
    { timeout: 5000 },
  )
  // Press and hold the remove button for >3s using real pointer events
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find((el) =>
      (el.getAttribute('aria-label') || '').includes('Hold to remove'),
    )
    b.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
  })
  await new Promise((r) => setTimeout(r, 3300)) // component fires onComplete at 3000ms
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find((el) =>
      (el.getAttribute('aria-label') || '').includes('Hold to remove'),
    )
    if (b) b.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }))
  })
  await new Promise((r) => setTimeout(r, 200))
  const suspRaw = await getLS('leitner-suspended')
  let suspOk = false
  let suspIds = []
  try {
    suspIds = JSON.parse(suspRaw || '[]')
    suspOk = Array.isArray(suspIds) && suspIds.length >= 1
  } catch { /* suspOk stays false */ }
  check('hold-to-remove persists to leitner-suspended', suspOk, `suspended=${JSON.stringify(suspIds)}`)

  // ---- Test 4: suspended survives reload too ----
  await page.reload({ waitUntil: 'networkidle0' })
  const suspAfter = await getLS('leitner-suspended')
  check('leitner-suspended survives reload', suspAfter === suspRaw, `after=${suspAfter}`)

  // ---- Test 5: overall stats strip is visible in the UI ----
  const hasStats = await page.evaluate(() => document.body.innerText.includes('% learned'))
  check('overall stats strip visible ("% learned")', hasStats)

} finally {
  await browser.close()
}

const failed = results.filter((r) => !r.pass)
console.log(`\n${results.length - failed.length}/${results.length} checks passed`)
process.exit(failed.length ? 1 : 0)
