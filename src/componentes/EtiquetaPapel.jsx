import { ROTULO_PAPEL } from '../permissoes';

export default function EtiquetaPapel({ papel }) {
  return <span className={`etiqueta papel-${papel}`}>{ROTULO_PAPEL[papel] ?? papel}</span>;
}
