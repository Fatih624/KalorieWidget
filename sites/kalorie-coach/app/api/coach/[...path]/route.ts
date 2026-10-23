import { env } from 'cloudflare:workers';
import { actor, ApiError, body, database, getJournal, randomToken, reply, sha } from '../../../../lib/server';
import { checkedSnapshot, preserveLegacyTemplates } from '../../../../lib/nutrition';
import { analyse } from '../../../../lib/analysis';
import { ProductSearchError } from '../../../../lib/product-search';
import { createResilientSearch } from '../../../../lib/search-fallback';
const resilientSearch = createResilientSearch({ usdaApiKey: env.USDA_API_KEY });
import { login, logout, saveOpenAIKey, storedOpenAIKey } from '../../../../lib/password-auth';
export const dynamic = 'force-dynamic';
type Context = { params: Promise<{ path: string[] }> };
async function handle(req: Request, context: Context) {
  try {
    const path = (await context.params).path.join('/'), db = database();
    if (path === 'login' && req.method === 'POST') return await login(req);
    if (path === 'logout' && req.method === 'POST') return await logout(req);
    if (path === 'claim' && req.method === 'POST') {
      // Owner-private Sites dispatch authenticates the native service caller before this handler.
      const input = await body(req, 1000);
      if (!/^[a-f0-9]{16}$/.test(input.code || '') || !/^[a-f0-9]{48}$/.test(input.token || '')) throw new ApiError(400, 'Bitte den vollständigen Kopplungscode eingeben.');
      const claimed = await db.prepare('UPDATE pairings SET claimed=1 WHERE hash=? AND claimed=0 AND expires_at>? RETURNING owner').bind(await sha(input.code), Date.now()).first<{ owner: string }>();
      if (!claimed) throw new ApiError(401, 'Der Kopplungscode ist ungültig oder abgelaufen. Bitte einen neuen Code erzeugen.');
      await db.prepare('INSERT INTO devices (hash,owner,name,created_at) VALUES (?,?,?,?)').bind(await sha(input.token), claimed.owner, 'Windows-Widget', Date.now()).run(); return reply({ connected: true });
    }
    const user = await actor(req);
    if (path === 'state' && req.method === 'GET') return reply(await getJournal(user.owner));
    if (path === 'state' && req.method === 'PUT') {
      const input = await body(req);
      const incoming = checkedSnapshot(input.snapshot);
      if (!Number.isSafeInteger(input.expectedRevision) || input.expectedRevision < 0) throw new ApiError(400, 'Die Versionsangabe fehlt.');
      const current = await getJournal(user.owner);
      const snapshot = preserveLegacyTemplates(incoming, current.snapshot);
      const updated = await db.prepare('UPDATE journals SET body=?,revision=revision+1,updated_at=? WHERE owner=? AND revision=? RETURNING revision').bind(JSON.stringify(snapshot), Date.now(), user.owner, input.expectedRevision).first<{ revision: number }>();
      if (!updated) return reply({ error: 'Auf einem anderen Gerät geändert. Bitte erneut synchronisieren.', conflict: true }, 409);
      return reply({ revision: updated.revision, snapshot });
    }
    if (path === 'pair' && req.method === 'POST' && user.browser) { const code = randomToken(8); await db.prepare('DELETE FROM pairings WHERE expires_at < ? OR (owner=? AND claimed=0)').bind(Date.now(), user.owner).run(); await db.prepare('INSERT INTO pairings (hash,owner,expires_at,claimed) VALUES (?,?,?,0)').bind(await sha(code), user.owner, Date.now() + 600000).run(); return reply({ code, expiresAt: Date.now() + 600000 }); }
    if (path === 'devices' && req.method === 'GET' && user.browser) { const rows = await db.prepare('SELECT hash,name,created_at FROM devices WHERE owner=?').bind(user.owner).all(); return reply({ devices: rows.results }); }
    if (path === 'devices' && req.method === 'DELETE' && user.browser) { const input = await body(req, 500); await db.prepare('DELETE FROM devices WHERE hash=? AND owner=?').bind(String(input.hash || ''), user.owner).run(); return reply({ removed: true }); }
    if (path === 'key' && req.method === 'DELETE' && user.browser) { await db.prepare('DELETE FROM owner_secrets WHERE owner=?').bind(user.owner).run(); return reply({removed:true}); }
    if (path === 'key' && req.method === 'PUT' && user.browser) { try { const input=await body(req,1000); await saveOpenAIKey(user.owner,input.key); return reply({saved:true}); } catch {throw new ApiError(400,'Der Schlüssel konnte nicht gespeichert werden. Bitte Eingabe prüfen.');} }
    if (path === 'analyse' && req.method === 'POST') return reply(await analyse(user.owner, await body(req, 2_100_000)));
    if (path === 'status' && req.method === 'GET') { const day = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()); const quota = await db.prepare('SELECT calls FROM quotas WHERE owner=? AND day=?').bind(user.owner, day).first<{ calls: number }>(); return reply({ aiConfigured: !!(await storedOpenAIKey(user.owner)), model: env.OPENAI_MODEL || 'gpt-4.1-mini', calls: quota?.calls || 0, dailyLimit: Math.max(0, Math.min(30, parseInt(env.AI_DAILY_LIMIT || '10') || 0)) }); }
    if (path === 'search' && req.method === 'GET') {
      const query = new URL(req.url).searchParams.get('q')?.trim() || ''; if (query.length < 2 || query.length > 120) throw new ApiError(400, 'Bitte 2 bis 120 Zeichen suchen.');
      const slot = `search-${Math.floor(Date.now() / 7000)}`; const claim = await db.prepare('INSERT OR IGNORE INTO quotas(owner,day,calls) VALUES(?,?,1) RETURNING calls').bind(user.owner, slot).first();
      if (!claim) throw new ApiError(429, 'Bitte vor der nächsten Produktsuche kurz warten (7 Sekunden).');
      return reply(await resilientSearch(query));
    }
    throw new ApiError(404, 'Diese Funktion ist nicht verfügbar.');
  } catch (error) { if (error instanceof ProductSearchError) { const response = reply({ error: error.message, code: error.code }, error.status); if (error.retryAfter) response.headers.set('retry-after', String(error.retryAfter)); return response; } if (error instanceof ApiError) return reply({ error: error.message }, error.status); if (error instanceof Error && /Ungültig|Doppelte|Nährwert/.test(error.message)) return reply({ error: error.message }, 400); return reply({ error: 'Die Anfrage konnte nicht abgeschlossen werden. Deine lokalen Einträge bleiben erhalten.' }, 500); }
}
export const GET = handle; export const POST = handle; export const PUT = handle; export const DELETE = handle;
