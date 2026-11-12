const unidades = [
  'zero', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove',
  'dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove',
];
const dezenas = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
const centenas = [
  '', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos',
  'seiscentos', 'setecentos', 'oitocentos', 'novecentos',
];

function abaixoDe100(n: number): string {
  if (n < 20) return unidades[n];
  const d = Math.floor(n / 10);
  const r = n % 10;
  return dezenas[d] + (r ? ` e ${unidades[r]}` : '');
}

function abaixoDe1000(n: number): string {
  if (n === 100) return 'cem';
  const c = Math.floor(n / 100);
  const r = n % 100;
  if (!c) return abaixoDe100(r);
  return centenas[c] + (r ? ` e ${abaixoDe100(r)}` : '');
}

function inteiroPorExtenso(n: number): string {
  if (n === 0) return 'zero';
  const milhoes = Math.floor(n / 1_000_000);
  const milhares = Math.floor(n / 1_000) % 1_000;
  const resto = n % 1_000;
  const partes: string[] = [];

  if (milhoes) partes.push(`${abaixoDe1000(milhoes)} ${milhoes === 1 ? 'milhão' : 'milhões'}`);
  if (milhares) partes.push(milhares === 1 ? 'mil' : `${abaixoDe1000(milhares)} mil`);
  if (resto) partes.push(abaixoDe1000(resto));

  if (partes.length === 1) return partes[0];
  return `${partes.slice(0, -1).join(', ')} e ${partes[partes.length - 1]}`;
}

export function valorPorExtenso(valor: number): string {
  const total = Math.round(Math.abs(valor) * 100);
  const reais = Math.floor(total / 100);
  const centavos = total % 100;
  const partes: string[] = [];

  if (reais) partes.push(`${inteiroPorExtenso(reais)} ${reais === 1 ? 'real' : 'reais'}`);
  if (centavos) partes.push(`${inteiroPorExtenso(centavos)} ${centavos === 1 ? 'centavo' : 'centavos'}`);

  const texto = partes.length ? partes.join(' e ') : 'zero real';
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}
