// 15 tema. Her temada 6 renk kodu var; menu/kutu renkleri bunlardan otomatik uretilir.
// zemin  : ana arka plan
// zemin2 : panel / alt sayfa zemini
// vurgu  : birincil vurgu (ikonlar, isaretler)
// vurgu2 : ikincil vurgu (gecisler, lekeler)
// metin  : ana yazi
// soluk  : ikincil yazi
export const TEMALAR = [
  { id: 'mor',        ad: 'Mor',         koyu: true,  zemin: '#14101f', zemin2: '#1e1733', vurgu: '#a78bfa', vurgu2: '#f0abfc', metin: '#f3eefc', soluk: '#a79dc4' },
  { id: 'gece',       ad: 'Gece Mavisi', koyu: true,  zemin: '#0b1020', zemin2: '#141c33', vurgu: '#7aa7ff', vurgu2: '#5fe3d0', metin: '#eaf0ff', soluk: '#94a3c4' },
  { id: 'kirmizi',    ad: 'Kırmızı',     koyu: true,  zemin: '#1a0d10', zemin2: '#2a1418', vurgu: '#ff6b6b', vurgu2: '#ffa07a', metin: '#ffeeee', soluk: '#c49a9a' },
  { id: 'yavruagzi',  ad: 'Yavru Ağzı',  koyu: false, zemin: '#fff1ec', zemin2: '#ffe3da', vurgu: '#f4796b', vurgu2: '#ffb59e', metin: '#4a2620', soluk: '#9c6e64' },
  { id: 'zumrut',     ad: 'Zümrüt',      koyu: true,  zemin: '#08150f', zemin2: '#0f2419', vurgu: '#4ade80', vurgu2: '#a7f3d0', metin: '#e9fff2', soluk: '#8fb8a2' },
  { id: 'turkuaz',    ad: 'Turkuaz',     koyu: true,  zemin: '#07171a', zemin2: '#0d262b', vurgu: '#2dd4bf', vurgu2: '#67e8f9', metin: '#e6fbff', soluk: '#8ab4b8' },
  { id: 'kavun',      ad: 'Kavun',       koyu: false, zemin: '#fff6ea', zemin2: '#ffe9cf', vurgu: '#f08a3c', vurgu2: '#ffc46b', metin: '#4a3018', soluk: '#9c7a55' },
  { id: 'lila',       ad: 'Lila',        koyu: false, zemin: '#f7f2ff', zemin2: '#ebe0ff', vurgu: '#8b5cf6', vurgu2: '#c4b5fd', metin: '#2f2444', soluk: '#7d6f99' },
  { id: 'bal',        ad: 'Bal',         koyu: true,  zemin: '#1a1408', zemin2: '#2a210e', vurgu: '#fbbf24', vurgu2: '#fde68a', metin: '#fff8e6', soluk: '#bfa87a' },
  { id: 'gulkurusu',  ad: 'Gül Kurusu',  koyu: false, zemin: '#fdf0f2', zemin2: '#f7dfe4', vurgu: '#c2687e', vurgu2: '#e9a8b6', metin: '#432028', soluk: '#8f6a73' },
  { id: 'okyanus',    ad: 'Okyanus',     koyu: true,  zemin: '#061424', zemin2: '#0c2238', vurgu: '#38bdf8', vurgu2: '#818cf8', metin: '#e8f6ff', soluk: '#88a6bd' },
  { id: 'orman',      ad: 'Orman',       koyu: true,  zemin: '#0d1710', zemin2: '#16261a', vurgu: '#84cc16', vurgu2: '#d9f99d', metin: '#f0ffe6', soluk: '#9db08c' },
  { id: 'komur',      ad: 'Kömür',       koyu: true,  zemin: '#121212', zemin2: '#1e1e1e', vurgu: '#d4d4d8', vurgu2: '#a1a1aa', metin: '#fafafa', soluk: '#9e9ea6' },
  { id: 'kar',        ad: 'Kar',         koyu: false, zemin: '#fbfcfe', zemin2: '#eef1f7', vurgu: '#4b5f8a', vurgu2: '#9db3d8', metin: '#1e2532', soluk: '#6b7484' },
  { id: 'fusya',      ad: 'Fuşya',       koyu: true,  zemin: '#1a0a17', zemin2: '#2a1026', vurgu: '#f472b6', vurgu2: '#e879f9', metin: '#ffeef8', soluk: '#c093ad' }
]

export const VARSAYILAN = 'mor'


// Her temanin kendi seri paleti. Referans paletin ton MESAFELERI korunarak
// temanin vurgu tonuna dondurulmus hali: 1. seri hep temanin rengiyle ayni ailede.
// 15 paletin hepsi dogrulayicidan gecti: renk korlugu ayrimi, kroma tabani,
// aciklik bandi ve zemin kontrasti - her temanin kendi zemininde olculdu.
export const SERI_PALETI = {
  mor:        ['#8e6de3', '#c0702d', '#c273c3', '#2e87ea', '#bc3403', '#28a04b'],
  gece:       ['#447ff9', '#cf5f57', '#9f7deb', '#0495ba', '#c1175b', '#809100'],
  kirmizi:    ['#d75757', '#099e78', '#8777cd', '#0ba9b2', '#689803', '#465ed1'],
  yavruagzi:  ['#c7493e', '#0bae8e', '#9c81e2', '#01c9dd', '#86b54f', '#515ad1'],
  zumrut:     ['#0fa152', '#936be1', '#be7128', '#c572bf', '#3b85ec', '#b73c02'],
  turkuaz:    ['#0b9e78', '#8777ce', '#0ba9b1', '#699802', '#455ed1', '#d75758'],
  kavun:      ['#e17301', '#02ad92', '#daac07', '#ed7b8d', '#06804c', '#536fd8'],
  lila:       ['#9982e3', '#0fc9da', '#8ab44c', '#4d5cd1', '#c74843', '#01af8b'],
  bal:        ['#aa7f05', '#d76c9a', '#7a75ea', '#9a5a05', '#059d85', '#b55dc4'],
  gulkurusu:  ['#c3466b', '#1cb258', '#778deb', '#0fcdbd', '#aea929', '#006cc4'],
  okyanus:    ['#0493c6', '#bc2b4a', '#6d9704', '#647bed', '#c7674f', '#aa7cdb'],
  orman:      ['#619a00', '#4958dd', '#df4e4c', '#0a9e7c', '#8b73d4', '#04a9b4'],
  komur:      ['#8f83f1', '#0b97ae', '#bc1b70', '#8f8c07', '#0586f5', '#ce5d68'],
  kar:        ['#4872d8', '#e76e0b', '#0dae8b', '#e0a80b', '#ec7b95', '#01813f'],
  fusya:      ['#d24f96', '#539d06', '#4b86dc', '#01af85', '#9f8501', '#0174a5'],
}

export function temaBul(id) {
  const t = TEMALAR.find((x) => x.id === id) || TEMALAR.find((x) => x.id === VARSAYILAN)
  return { ...t, seriler: SERI_PALETI[t.id] }
}

// Kutu / cizgi / basili renkleri temanin koyu-acik olusundan otomatik turetilir.
export function temayiUygula(tema) {
  const k = document.documentElement.style
  k.setProperty('--zemin', tema.zemin)
  k.setProperty('--zemin-2', tema.zemin2)
  k.setProperty('--vurgu', tema.vurgu)
  k.setProperty('--vurgu-2', tema.vurgu2)
  k.setProperty('--metin', tema.metin)
  k.setProperty('--metin-soluk', tema.soluk)

  const t = tema.koyu ? '255, 255, 255' : '0, 0, 0'
  k.setProperty('--kutu', `rgba(${t}, ${tema.koyu ? 0.07 : 0.045})`)
  k.setProperty('--kutu-cizgi', `rgba(${t}, ${tema.koyu ? 0.16 : 0.1})`)
  k.setProperty('--kutu-basili', `rgba(${t}, ${tema.koyu ? 0.14 : 0.09})`)
  k.setProperty('--leke-opak', tema.koyu ? '0.5' : '0.34')

  ;(tema.seriler || []).forEach((renk, i) => k.setProperty('--seri-' + (i + 1), renk))

  document.body.dataset.koyu = tema.koyu ? 'evet' : 'hayir'
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', tema.zemin)
}
