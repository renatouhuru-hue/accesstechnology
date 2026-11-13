import { next } from '@vercel/functions';

/**
 * Protege o app inteiro com HTTP Basic Auth (prompt nativo do navegador).
 * A senha fica na env var APP_PASSWORD (Vercel), nunca no código.
 *
 * Usuário: acesso
 * Senha:   valor de APP_PASSWORD
 */

const USERNAME = 'acesso';
const REALM = 'Accesstechnology';

function safeEqual(a: string, b: string): boolean {
  const max = Math.max(a.length, b.length);
  let diff = a.length ^ b.length;
  for (let i = 0; i < max; i += 1) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}

function challenge(message: string, status: number): Response {
  const headers: Record<string, string> = {
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'no-store, max-age=0',
  };
  if (status === 401) {
    headers['WWW-Authenticate'] = `Basic realm="${REALM}", charset="UTF-8"`;
  }
  return new Response(message, { status, headers });
}

export default function proxy(request: Request) {
  const password = process.env.APP_PASSWORD ?? '';

  if (!password) {
    return challenge(
      'APP_PASSWORD não configurada no projeto da Vercel. Defina a variável de ambiente e faça um novo deploy.',
      500,
    );
  }

  const header = request.headers.get('authorization') ?? '';

  if (header.toLowerCase().startsWith('basic ')) {
    let decoded = '';
    try {
      decoded = atob(header.slice(6).trim());
    } catch {
      decoded = '';
    }

    const separator = decoded.indexOf(':');
    if (separator > -1) {
      const user = decoded.slice(0, separator);
      const pass = decoded.slice(separator + 1);

      if (safeEqual(user, USERNAME) && safeEqual(pass, password)) {
        return next({
          headers: { 'Cache-Control': 'private, no-store, max-age=0' },
        });
      }
    }
  }

  return challenge('Acesso restrito. Informe usuário e senha.', 401);
}
