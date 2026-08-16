// Seri renkleri temadan gelir (temalar.js -> SERI_PALETI).
// Sira SABIT: renk kolonun tablodaki yerinden okunur, grafikteki yerinden degil.
// Boylece bir kolon grafikten cikarilinca kalanlarin rengi degismez.
const YEDEK = ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181', '#008300']

export function seriRengi(sira, tema) {
  const palet = tema?.seriler?.length ? tema.seriler : YEDEK
  return palet[sira % palet.length]
}

export const SERI_SINIRI = 6
