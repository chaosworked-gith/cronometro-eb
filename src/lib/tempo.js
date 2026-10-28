// Tempos ficam guardados em segundos e aparecem sempre como HH:MM:SS (horas podem passar de 24).

export function formatarHMS(segundos) {
  if (segundos == null || Number.isNaN(segundos)) return '';
  const total = Math.max(0, Math.round(segundos));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':');
}

// Aceita "HH:MM:SS" ou "HH:MM". Devolve null se não for um tempo.
export function lerHMS(texto) {
  const partes = String(texto ?? '').trim().match(/^(\d{1,4}):(\d{1,2})(?::(\d{1,2}))?$/);
  if (!partes) return null;
  const [, h, m, s = '0'] = partes;
  if (Number(m) > 59 || Number(s) > 59) return null;
  return Number(h) * 3600 + Number(m) * 60 + Number(s);
}

export function horasParaSegundos(horas) {
  if (horas == null || Number.isNaN(Number(horas))) return null;
  return Math.round(Number(horas) * 3600);
}

export function segundosParaHoras(segundos) {
  if (segundos == null) return null;
  return segundos / 3600;
}
