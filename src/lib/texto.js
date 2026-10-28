// Comparação sem diferenciar maiúsculas, acentos e espaços repetidos.
export function normalizar(texto) {
  return String(texto ?? '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

export function ordenarPorTexto(campo) {
  return (a, b) => String(a[campo] ?? '').localeCompare(String(b[campo] ?? ''), 'pt-BR');
}
