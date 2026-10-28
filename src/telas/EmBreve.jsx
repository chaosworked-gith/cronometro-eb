export default function EmBreve({ tela }) {
  const Icone = tela.icone;
  return (
    <section className="pagina">
      <h1 className="titulo-pagina">{tela.rotulo}</h1>
      <div className="cartao em-breve">
        <div className="em-breve-icone">
          <Icone size={32} aria-hidden="true" />
        </div>
        <span className="etiqueta etiqueta-destaque">Em breve</span>
        <p>{tela.descricao}</p>
        <p className="texto-secundario">Esta tela chega nas próximas fases do projeto.</p>
      </div>
    </section>
  );
}
