import './style.css'
import QRCode from 'qrcode'
import templates from './templates.json'

// ─── DOM References ──────────────────────────────────────────
const urlInput = document.getElementById('url-input')
const frameColorPicker = document.getElementById('frame-color-picker')
const generateBtn = document.getElementById('generate-btn')
const previewCard = document.getElementById('preview-card')
const qrResultBody = document.getElementById('qr-result-body')
const placeholder = document.getElementById('placeholder')
const qrCanvas = document.getElementById('qrcode-canvas')
const downloadBtn = document.getElementById('download-btn')
const copyBtn = document.getElementById('copy-btn')
const templateGallery = document.getElementById('template-gallery')
const textColorPicker = document.getElementById('text-color-picker')
const qrColorPicker = document.getElementById('qr-color-picker')
const qrStyleSelect = document.getElementById('qr-style-select')

const sidebar = document.getElementById('sidebar')
const sidebarToggle = document.getElementById('sidebar-toggle')
const frameBgItem = document.getElementById('frame-bg-item')
const frameTextItem = document.getElementById('frame-text-item')
const globalLabelInput = document.getElementById('global-label-input')
const globalLabelItem = document.getElementById('global-label-item')
const btnText = generateBtn.querySelector('.btn-text')
const loadingSpinner = generateBtn.querySelector('.loading-spinner')
const langBtn = document.querySelector('.lang-btn')
const langOptions = document.querySelectorAll('.lang-dropdown a')

// Mode Switch
const modeSingleBtn = document.getElementById('mode-single')
const modeMultipleBtn = document.getElementById('mode-multiple')
const singleUrlContainer = document.getElementById('single-url-container')
const multipleUrlContainer = document.getElementById('multiple-url-container')
const multiUrlInput = document.getElementById('multi-url-input')
const generateMultiBtn = document.getElementById('generate-multi-btn')
const qrMultiResultBody = document.getElementById('qr-multi-result-body')
const qrGrid = document.getElementById('qr-grid')
const downloadAllBtn = document.getElementById('download-all-btn')
const showUrlToggle = document.getElementById('show-url-toggle')

// Edit Modal
const editModal = document.getElementById('edit-modal')
const closeModal = document.getElementById('close-modal')
const saveEditBtn = document.getElementById('save-edit-btn')
const editLabelInput = document.getElementById('edit-label-input')
const editBgColor = document.getElementById('edit-bg-color')
const editTextColor = document.getElementById('edit-text-color')
const editQrColor = document.getElementById('edit-qr-color')
const editQrStyle = document.getElementById('edit-qr-style')
const editShowUrl = document.getElementById('edit-show-url')
const totalCountBadge = document.getElementById('total-count-badge')
const lifetimeCountEl = document.getElementById('lifetime-count')

// ─── State ───────────────────────────────────────────────────
let selectedTemplateId = 'clean'
let lifetimeCount = parseInt(localStorage.getItem('pouchen_qr_lifetime_count') || '0')

function updateLifetimeDisplay() {
  if (lifetimeCountEl) lifetimeCountEl.textContent = lifetimeCount.toLocaleString()
}

function addLifetimeCount(n) {
  lifetimeCount += n
  localStorage.setItem('pouchen_qr_lifetime_count', lifetimeCount)
  updateLifetimeDisplay()
}

// ─── Logo Loading (with error resilience) ────────────────────
const logoImg = new Image()
logoImg.crossOrigin = 'anonymous'
logoImg.src = import.meta.env.BASE_URL + 'logo.png'

const logoLoadPromise = new Promise((resolve) => {
  logoImg.onload = () => resolve(true)
  logoImg.onerror = () => {
    console.warn('Logo failed to load — QR codes will render without a center logo.')
    resolve(false)
  }
  if (logoImg.complete) resolve(true)
})

// ─── Template Gallery ────────────────────────────────────────
function applyTemplateUI(template) {
  if (template.hasFrame) {
    frameBgItem.classList.remove('hidden')
    frameTextItem.classList.remove('hidden')
    globalLabelItem.classList.remove('hidden')
    frameColorPicker.value = template.primaryColor
    textColorPicker.value = template.textColor || '#ffffff'
    globalLabelInput.placeholder = template.label || ''
  } else {
    frameBgItem.classList.add('hidden')
    frameTextItem.classList.add('hidden')
    globalLabelItem.classList.add('hidden')
  }
}

function initGallery() {
  templateGallery.innerHTML = templates.map(t => `
    <div class="template-card ${t.id === selectedTemplateId ? 'active' : ''}" data-id="${t.id}">
      <h4>${t.name}</h4>
      <p>${t.description}</p>
    </div>
  `).join('')

  templateGallery.querySelectorAll('.template-card').forEach(card => {
    card.addEventListener('click', () => {
      templateGallery.querySelectorAll('.template-card').forEach(c => c.classList.remove('active'))
      card.classList.add('active')
      selectedTemplateId = card.dataset.id
      const template = templates.find(t => t.id === selectedTemplateId)
      applyTemplateUI(template)
      triggerRegenerate()
    })
  })

  applyTemplateUI(templates.find(t => t.id === selectedTemplateId))
}

// ─── Localization ────────────────────────────────────────────
const translations = {
  en: {
    hero: "From URL to <br>QR Code, <span>instantly.</span>",
    selectTemplate: "Select Frame Template",
    frameLabel: "QR Code & Frame Style",
    targetUrl: "Enter Target URL",
    generate: "Generate Now",
    placeholder: "Your QR code will appear here",
    download: "Download PNG",
    copy: "Copy Link"
  },
  zh: {
    hero: "從 URL 到 <br>QR 碼，<span>瞬間完成。</span>",
    selectTemplate: "選擇邊框模板",
    frameLabel: "二維碼和邊框樣式",
    targetUrl: "輸入目標 URL",
    generate: "立即生成",
    placeholder: "您的二維碼將在這裡顯示",
    download: "下載 PNG",
    copy: "複製鏈接"
  },
  tw: {
    hero: "從 URL 到 <br>QR 碼，<span>瞬間完成。</span>",
    selectTemplate: "選擇邊框模板",
    frameLabel: "二維碼和邊框樣式",
    targetUrl: "輸入目標 URL",
    generate: "立即生成",
    placeholder: "您的二維碼將在這裡顯示",
    download: "下載 PNG",
    copy: "複製鏈接"
  },
  mm: {
    hero: "URL မှ QR Code သို့ <br><span>ချက်ချင်းပြောင်းပါ။</span>",
    selectTemplate: "ဘောင်ပုံစံကို ရွေးပါ",
    frameLabel: "QR ကုဒ်နှင့် ဘောင်စတိုင်",
    targetUrl: "URL ထည့်ပါ",
    generate: "အခုပဲ ထုတ်ယူပါ",
    placeholder: "သင်၏ QR ကုဒ် ဤနေရာတွင် ပေါ်လာပါမည်",
    download: "PNG ဒေါင်းလုဒ်လုပ်ပါ",
    copy: "လင့်ခ်ကို ကူးယူပါ"
  },
  vn: {
    hero: "Từ URL sang <br>Mã QR, <span>ngay tức thì.</span>",
    selectTemplate: "Chọn mẫu khung",
    frameLabel: "Kiểu mã QR & khung",
    targetUrl: "Nhập URL mục tiêu",
    generate: "Tạo ngay",
    placeholder: "Mã QR của bạn sẽ xuất hiện ở đây",
    download: "Tải xuống PNG",
    copy: "Sao chép liên kết"
  },
  id: {
    hero: "Dari URL ke <br>Kode QR, <span>seketika.</span>",
    selectTemplate: "Pilih Templat Bingkai",
    frameLabel: "Gaya Kode QR & Bingkai",
    targetUrl: "Masukkan URL Target",
    generate: "Buat Sekarang",
    placeholder: "Kode QR Anda akan muncul di sini",
    download: "Unduh PNG",
    copy: "Salin Tautan"
  }
}

function updateUILanguage(lang) {
  const t = translations[lang] || translations.en
  document.querySelector('.hero h1').innerHTML = t.hero
  // Use data-i18n attributes instead of fragile index-based selectors
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n
    if (t[key]) el.textContent = t[key]
  })
}

langOptions.forEach(opt => {
  opt.addEventListener('click', (e) => {
    e.preventDefault()
    const langCode = opt.dataset.lang
    langBtn.querySelector('span').innerText = opt.querySelector('span').innerText + ' ' + langCode.toUpperCase()
    updateUILanguage(langCode)
  })
})

// ─── Canvas Utilities ────────────────────────────────────────
function drawRoundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + width - radius, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
  ctx.lineTo(x + width, y + height - radius)
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
  ctx.lineTo(x + radius, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
  ctx.lineTo(x, y + radius)
  ctx.quadraticCurveTo(x, y, x + radius, y)
  ctx.closePath()
}

function wrapText(ctx, text, maxWidth) {
  const chars = text.split('')
  if (chars.length === 0) return ['']
  const lines = []
  let currentLine = chars[0]

  for (let i = 1; i < chars.length; i++) {
    const char = chars[i]
    const width = ctx.measureText(currentLine + char).width
    if (width < maxWidth) {
      currentLine += char
    } else {
      lines.push(currentLine)
      currentLine = char
    }
  }
  lines.push(currentLine)
  return lines
}

// ─── Mode Switching ──────────────────────────────────────────
function setMode(mode) {
  if (mode === 'single') {
    modeSingleBtn.classList.add('active')
    modeMultipleBtn.classList.remove('active')
    singleUrlContainer.classList.remove('hidden')
    multipleUrlContainer.classList.add('hidden')
  } else {
    modeSingleBtn.classList.remove('active')
    modeMultipleBtn.classList.add('active')
    singleUrlContainer.classList.add('hidden')
    multipleUrlContainer.classList.remove('hidden')
  }
  qrResultBody.classList.add('hidden')
  qrMultiResultBody.classList.add('hidden')
  placeholder.classList.remove('hidden')
  previewCard.classList.remove('active')
}

modeSingleBtn.addEventListener('click', () => setMode('single'))
modeMultipleBtn.addEventListener('click', () => setMode('multiple'))

// ─── Core Rendering Engine ───────────────────────────────────
async function drawQRToCanvas(canvas, url, templateId, options = {}) {
  const template = templates.find(t => t.id === templateId)
  if (!template) throw new Error(`Template "${templateId}" not found`)

  const finalFrameText = options.label || globalLabelInput.value.trim() || template.label
  const bgColor = options.bgColor || frameColorPicker.value || template.primaryColor
  const textColor = options.textColor || textColorPicker.value || template.textColor
  const qrColor = options.qrColor || qrColorPicker.value || '#000000'
  const qrStyle = options.qrStyle || qrStyleSelect.value || 'square'
  const showUrl = options.showUrl !== undefined ? options.showUrl : showUrlToggle.checked

  // Generate QR data matrix
  const qr = QRCode.create(url, { errorCorrectionLevel: 'H' })
  const modules = qr.modules
  const moduleCount = modules.size
  const qrSize = 512
  const cellSize = qrSize / moduleCount

  // Render QR modules to an offscreen canvas (no DOM attachment = no layout thrash)
  const tempCanvas = document.createElement('canvas')
  tempCanvas.width = qrSize
  tempCanvas.height = qrSize
  const tCtx = tempCanvas.getContext('2d')

  tCtx.fillStyle = qrColor
  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      if (modules.get(row, col)) {
        if (qrStyle === 'dots') {
          tCtx.beginPath()
          tCtx.arc(
            (col * cellSize) + (cellSize / 2),
            (row * cellSize) + (cellSize / 2),
            (cellSize / 2) * 0.8,
            0, Math.PI * 2
          )
          tCtx.fill()
        } else {
          tCtx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize)
        }
      }
    }
  }

  // Layout constants
  const frameWidth = 40
  const frameFooterHeight = template.hasFrame ? 120 : 0
  const canvasWidth = qrSize + (frameWidth * 2)

  // Pre-calculate URL text height using an offscreen measurement canvas
  // (avoids the race condition of measuring on the target canvas before sizing it)
  let urlTextLines = []
  const urlPadding = 40
  const urlLineHeight = 35
  let totalUrlHeight = 0

  if (showUrl) {
    const measureCanvas = document.createElement('canvas')
    const measureCtx = measureCanvas.getContext('2d')
    measureCtx.font = '500 24px Outfit, sans-serif'
    urlTextLines = wrapText(measureCtx, url, canvasWidth - 80)
    totalUrlHeight = (urlTextLines.length * urlLineHeight) + urlPadding
  }

  // Extra space for label on frameless templates
  let extraLabelHeight = 0
  if (finalFrameText && !template.hasFrame) {
    extraLabelHeight = 60
  }

  const canvasHeight = qrSize + (frameWidth * 2) + frameFooterHeight + totalUrlHeight + extraLabelHeight

  // Set final canvas dimensions (this resets context state — intentional)
  canvas.width = canvasWidth
  canvas.height = canvasHeight
  const ctx = canvas.getContext('2d')

  // White background
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvasWidth, canvasHeight)

  if (template.hasFrame) {
    // Colored frame background
    ctx.fillStyle = bgColor
    drawRoundedRect(ctx, 0, 0, canvasWidth, qrSize + (frameWidth * 2) + frameFooterHeight, 40)
    ctx.fill()

    // White border stroke
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'
    ctx.lineWidth = 10
    drawRoundedRect(ctx, 5, 5, canvasWidth - 10, qrSize + (frameWidth * 2) + frameFooterHeight - 10, 35)
    ctx.stroke()

    // White QR background inset
    ctx.fillStyle = '#ffffff'
    drawRoundedRect(ctx, frameWidth - 10, frameWidth - 10, qrSize + 20, qrSize + 20, 20)
    ctx.fill()

    // Frame label text
    if (finalFrameText) {
      ctx.fillStyle = textColor
      ctx.font = 'bold 30px Outfit, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(finalFrameText, canvasWidth / 2, qrSize + (frameWidth * 2) + frameFooterHeight - 45)
    }
  } else if (finalFrameText) {
    // Label for frameless templates
    ctx.fillStyle = '#1e293b'
    ctx.font = 'bold 30px Outfit, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(finalFrameText, canvasWidth / 2, qrSize + (frameWidth * 2) + 40)
  }

  // Composite QR onto main canvas
  ctx.drawImage(tempCanvas, frameWidth, frameWidth)

  // URL text at bottom
  if (showUrl) {
    ctx.fillStyle = '#1e293b'
    ctx.font = '500 24px Outfit, sans-serif'
    ctx.textAlign = 'center'
    urlTextLines.forEach((line, index) => {
      const y = qrSize + (frameWidth * 2) + frameFooterHeight + extraLabelHeight + 40 + (index * urlLineHeight)
      ctx.fillText(line, canvasWidth / 2, y)
    })
  }

  // Center logo (only if loaded successfully)
  if (template.logoCenter && logoImg.complete && logoImg.naturalWidth > 0) {
    const logoSize = qrSize * 0.22
    const centerX = canvasWidth / 2
    const centerY = frameWidth + (qrSize / 2)
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(centerX, centerY, (logoSize / 2) + 12, 0, Math.PI * 2)
    ctx.fill()
    ctx.drawImage(logoImg, centerX - (logoSize / 2), centerY - (logoSize / 2), logoSize, logoSize)
  }

  // Cleanup offscreen canvas reference for GC
  tempCanvas.width = 0
  tempCanvas.height = 0
}

// ─── Shared Regeneration Helper ──────────────────────────────
function triggerRegenerate() {
  if (modeSingleBtn.classList.contains('active') && urlInput.value.trim()) {
    generateQR()
  } else if (modeMultipleBtn.classList.contains('active') && multiUrlInput.value.trim()) {
    generateMultiQR()
  }
}

// ─── Single QR Generation ────────────────────────────────────
async function generateQR() {
  const url = urlInput.value.trim()
  if (!url) return

  btnText.classList.add('hidden')
  loadingSpinner.style.display = 'block'
  generateBtn.disabled = true

  try {
    await logoLoadPromise
    await drawQRToCanvas(qrCanvas, url, selectedTemplateId)
    placeholder.classList.add('hidden')
    qrMultiResultBody.classList.add('hidden')
    qrResultBody.classList.remove('hidden')
    previewCard.classList.add('active')
    addLifetimeCount(1)
  } catch (err) {
    console.error('QR generation failed:', err)
    alert('Failed to generate QR code. Please check the URL and try again.')
  } finally {
    btnText.classList.remove('hidden')
    loadingSpinner.style.display = 'none'
    generateBtn.disabled = false
  }
}

// ─── Multi QR Generation ─────────────────────────────────────
async function generateMultiQR() {
  const urls = multiUrlInput.value.split('\n').map(u => u.trim()).filter(u => u.length > 0)
  if (urls.length === 0) return

  const multiBtnText = generateMultiBtn.querySelector('.btn-text')
  const multiSpinner = generateMultiBtn.querySelector('.loading-spinner')

  multiBtnText.classList.add('hidden')
  multiSpinner.style.display = 'block'
  generateMultiBtn.disabled = true

  try {
    await logoLoadPromise
    qrGrid.innerHTML = ''
    
    // Update total count display
    if (totalCountBadge) {
      totalCountBadge.textContent = urls.length
      totalCountBadge.classList.remove('animate')
      void totalCountBadge.offsetWidth // Force reflow
      totalCountBadge.classList.add('animate')
    }
    
    addLifetimeCount(urls.length)

    for (let i = 0; i < urls.length; i++) {
      const line = urls[i]
      const parts = line.split('|').map(p => p.trim())
      const url = parts[0]
      const options = {
        label: parts[1] || null,
        bgColor: parts[2] || null,
        textColor: parts[3] || null,
        qrColor: parts[4] || null,
        qrStyle: parts[5] || null,
        showUrl: parts[6] === 'true' ? true : (parts[6] === 'false' ? false : undefined)
      }

      if (!url) continue

      const qrItem = document.createElement('div')
      qrItem.className = 'qr-item'

      const canvas = document.createElement('canvas')
      await drawQRToCanvas(canvas, url, selectedTemplateId, options)

      qrItem.appendChild(canvas)

      // Closure-safe click handler for edit modal
      ;((itemIndex, itemUrl, itemOptions) => {
        qrItem.addEventListener('click', () => {
          editLabelInput.value = itemOptions.label || globalLabelInput.value.trim() || ''
          editBgColor.value = itemOptions.bgColor || frameColorPicker.value || '#0066cc'
          editTextColor.value = itemOptions.textColor || textColorPicker.value || '#ffffff'
          editQrColor.value = itemOptions.qrColor || qrColorPicker.value || '#000000'
          editQrStyle.value = itemOptions.qrStyle || qrStyleSelect.value || 'square'
          editShowUrl.checked = itemOptions.showUrl !== undefined ? itemOptions.showUrl : showUrlToggle.checked

          editModal.classList.remove('hidden')

          saveEditBtn.onclick = () => {
            const lines = multiUrlInput.value.split('\n')
            lines[itemIndex] = [
              itemUrl,
              editLabelInput.value.trim(),
              editBgColor.value,
              editTextColor.value,
              editQrColor.value,
              editQrStyle.value,
              editShowUrl.checked
            ].join(' | ')
            multiUrlInput.value = lines.join('\n')

            editModal.classList.add('hidden')
            generateMultiQR()
          }
        })
      })(i, url, options)

      qrGrid.appendChild(qrItem)
    }

    placeholder.classList.add('hidden')
    qrResultBody.classList.add('hidden')
    qrMultiResultBody.classList.remove('hidden')
    previewCard.classList.add('active')
  } catch (err) {
    console.error('Multi QR generation failed:', err)
    alert('Error generating QR codes. Check the URLs and try again.')
  } finally {
    multiBtnText.classList.remove('hidden')
    multiSpinner.style.display = 'none'
    generateMultiBtn.disabled = false
  }
}

// ─── Event Listeners ─────────────────────────────────────────
generateBtn.addEventListener('click', generateQR)
generateMultiBtn.addEventListener('click', generateMultiQR)
urlInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') generateQR() })

// Live-update listeners (debounced via shared helper)
frameColorPicker.addEventListener('input', triggerRegenerate)
textColorPicker.addEventListener('input', triggerRegenerate)
qrColorPicker.addEventListener('input', triggerRegenerate)
qrStyleSelect.addEventListener('change', triggerRegenerate)
globalLabelInput.addEventListener('input', triggerRegenerate)
showUrlToggle.addEventListener('change', triggerRegenerate)

// Download (single)
downloadBtn.addEventListener('click', () => {
  try {
    const link = document.createElement('a')
    const sanitizedUrl = urlInput.value.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 40)
    link.download = `pouchen-qr-${sanitizedUrl || selectedTemplateId}.png`
    link.href = qrCanvas.toDataURL('image/png')
    link.click()
  } catch (err) {
    console.error('Download failed:', err)
    alert('Failed to download. The QR code may not have been generated yet.')
  }
})

// Copy URL to clipboard (safe — doesn't destroy button DOM)
copyBtn.addEventListener('click', async () => {
  const textSpan = copyBtn.querySelector('span')
  try {
    await navigator.clipboard.writeText(urlInput.value)
    const original = textSpan.textContent
    textSpan.textContent = '✓ Copied!'
    setTimeout(() => { textSpan.textContent = original }, 2000)
  } catch (err) {
    console.warn('Clipboard API unavailable, falling back to selection.')
    urlInput.select()
    document.execCommand('copy')
    const original = textSpan.textContent
    textSpan.textContent = '✓ Copied!'
    setTimeout(() => { textSpan.textContent = original }, 2000)
  }
})

// Download All (staggered to avoid browser blocking)
downloadAllBtn.addEventListener('click', () => {
  const canvases = qrGrid.querySelectorAll('canvas')
  if (canvases.length === 0) return
  canvases.forEach((canvas, index) => {
    setTimeout(() => {
      try {
        const link = document.createElement('a')
        link.download = `qr-code-${index + 1}.png`
        link.href = canvas.toDataURL('image/png')
        link.click()
      } catch (err) {
        console.error(`Download failed for QR #${index + 1}:`, err)
      }
    }, index * 150)
  })
})

// Sidebar toggle
sidebarToggle.addEventListener('click', () => {
  sidebar.classList.toggle('collapsed')
})

// Modal controls
closeModal.addEventListener('click', () => editModal.classList.add('hidden'))
window.addEventListener('mousedown', (e) => {
  if (e.target === editModal) {
    saveEditBtn.click()
  }
})

// ─── Init ────────────────────────────────────────────────────
initGallery()
updateLifetimeDisplay()
window.addEventListener('load', () => urlInput.focus())
