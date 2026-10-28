import { urlMarca } from '../lib/marca';

// Sempre o arquivo oficial: branco sobre fundo escuro, azul sobre fundo claro.
// Nunca recriar o logo em texto nem aplicar sombra, rotação ou mudança de cor.
const ARQUIVOS = {
  'horizontal-branco': 'Logotipo_Horizontal_Branco.png',
  'vertical-branco': 'Logotipo_Vertical_Branco.png',
  'horizontal-azul': 'Logotipo_Horizontal_Azul.png',
  'vertical-azul': 'Logotipo_Vertical_Azul.png',
  'icone-branco': 'Icone_Branco.png',
  'icone-azul': 'Icone_Azul.png',
};

const LARGURA_CELULAR = '(max-width: 760px)';

// versaoCelular: troca por outra versão (normalmente o ícone) em telas pequenas.
export default function Logo({ versao, versaoCelular, className = '' }) {
  const img = <img src={urlMarca(`logos/${ARQUIVOS[versao]}`)} alt="Elétrica Bahiana" className={className} />;
  if (!versaoCelular) return img;
  return (
    <picture>
      <source media={LARGURA_CELULAR} srcSet={urlMarca(`logos/${ARQUIVOS[versaoCelular]}`)} />
      {img}
    </picture>
  );
}
