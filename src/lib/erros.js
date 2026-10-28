export function mensagemDeErro(erro) {
  if (erro?.code === 'permission-denied') return 'Você não tem permissão para fazer isso.';
  if (erro?.code === 'unavailable') return 'Sem conexão com o servidor. Tente de novo.';
  return 'Não foi possível salvar. Tente de novo.';
}
