const ROTULOS = { em_andamento: 'Em andamento', pausada: 'Pausada', concluida: 'Concluída' };

export default function EtiquetaSituacao({ status }) {
  return <span className={`etiqueta situacao-${status}`}>{ROTULOS[status] ?? status}</span>;
}
