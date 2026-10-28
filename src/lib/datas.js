// Todas as datas do app usam o fuso da Bahia, nunca o fuso do navegador.
export const FUSO = 'America/Bahia';

const formatoData = new Intl.DateTimeFormat('pt-BR', {
  timeZone: FUSO,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const formatoHora = new Intl.DateTimeFormat('pt-BR', {
  timeZone: FUSO,
  hour: '2-digit',
  minute: '2-digit',
});

function paraDate(valor) {
  if (!valor) return null;
  if (typeof valor.toDate === 'function') return valor.toDate();
  const data = valor instanceof Date ? valor : new Date(valor);
  return Number.isNaN(data.getTime()) ? null : data;
}

export function formatarDataHora(valor) {
  const data = paraDate(valor);
  if (!data) return '';
  return `${formatoData.format(data)} às ${formatoHora.format(data)}`;
}
