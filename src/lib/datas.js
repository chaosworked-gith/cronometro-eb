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

// Datas de demandas (solicitação, ajuste, entrega) são guardadas como texto "AAAA-MM-DD",
// sem hora, para não depender de fuso.

const formatoDiaISO = new Intl.DateTimeFormat('en-CA', {
  timeZone: FUSO,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

// Dia na Bahia ("AAAA-MM-DD") de um momento: Date, milissegundos ou Timestamp do Firestore.
export function diaISO(valor = new Date()) {
  return formatoDiaISO.format(paraDate(valor) ?? new Date());
}

export function dataISO(ano, mes, dia) {
  const data = new Date(Date.UTC(ano, mes - 1, dia));
  if (data.getUTCFullYear() !== ano || data.getUTCMonth() !== mes - 1 || data.getUTCDate() !== dia) return null;
  return data.toISOString().slice(0, 10);
}

export function diasEntre(isoInicio, isoFim) {
  return Math.round((Date.parse(`${isoFim}T00:00:00Z`) - Date.parse(`${isoInicio}T00:00:00Z`)) / 86400000);
}

export function somarDias(iso, dias) {
  const data = new Date(Date.parse(`${iso}T00:00:00Z`) + dias * 86400000);
  return data.toISOString().slice(0, 10);
}

export function formatarData(iso) {
  if (!iso) return '';
  const [ano, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${ano}`;
}

const NOMES_MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export function nomeDoMes(mesNumero) {
  return NOMES_MESES[mesNumero - 1];
}

// "2026-10" vira "Outubro 2026"
export function rotuloMes(mes) {
  const [ano, numero] = mes.split('-').map(Number);
  return `${nomeDoMes(numero)} ${ano}`;
}
