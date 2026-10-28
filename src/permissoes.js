// Permissões por papel. Espelham as regras do Firestore (firestore.rules):
// as regras são a proteção real, a interface só esconde o que o papel não pode usar.

export const DOMINIO = 'eletricabahiana.com.br';

export const PAPEIS = ['admin', 'equipe', 'gestor', 'diretoria'];

export const ROTULO_PAPEL = {
  admin: 'Admin',
  equipe: 'Equipe',
  gestor: 'Gestor',
  diretoria: 'Diretoria',
};

export const DESCRICAO_PAPEL = {
  admin: 'Tudo, inclusive cadastrar pessoas e editar tabelas.',
  equipe: 'Usa o cronômetro e registra demandas.',
  gestor: 'Vê tudo, não altera.',
  diretoria: 'Vê tudo, não altera. Entra direto no Painel.',
};

export function emailDaEB(email) {
  return typeof email === 'string' && email.toLowerCase().endsWith(`@${DOMINIO}`);
}

export function papelValido(papel) {
  return PAPEIS.includes(papel);
}

export function podeEscrever(papel) {
  return papel === 'admin' || papel === 'equipe';
}
