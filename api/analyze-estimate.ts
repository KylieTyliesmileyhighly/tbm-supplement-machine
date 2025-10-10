
import type { VercelRequest, VercelResponse } from '@vercel/node';
import pdf from 'pdf-parse';
import OpenAI from 'openai';

const TBM_SYSTEM_PROMPT = (await import('../src/lib/prompt.js')).TBM_SYSTEM_PROMPT;
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function unauthorized(res: VercelResponse) { return res.status(401).json({ error: 'Unauthorized' }); }
function okNoContent(res: VercelResponse) { return res.status(204).end(); }

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const hdr = req.headers['x-tbm-auth'] as string | undefined;
  if (!hdr) return unauthorized(res);
  const [user, pass] = Buffer.from(hdr, 'base64').toString('utf8').split(':');
  if (user !== process.env.TBM_LOGIN_USER || pass !== process.env.TBM_LOGIN_PASS) return unauthorized(res);

  if (req.method === 'POST' && (req.headers['content-type']||'').includes('multipart/form-data')) {
    try {
      const busboy = (await import('busboy')).default;
      const bb = busboy({ headers: req.headers });
      const chunks: Buffer[] = [];
      const meta: Record<string, string> = {};
      let hadFile = false;

      await new Promise<void>((resolve, reject) => {
        bb.on('file', (_name, file, info) => {
          hadFile = true;
          const acc: Buffer[] = [];
          file.on('data', (d: Buffer) => acc.push(d));
          file.on('end', () => chunks.push(Buffer.concat(acc)));
        });
        bb.on('field', (n, v) => { meta[n] = String(v); });
        bb.on('error', reject);
        bb.on('finish', () => resolve());
        (req as any).pipe(bb);
      });

      if (!hadFile) return res.status(400).json({ error: 'No files uploaded' });

      const first = chunks[0];
      let extracted = '';
      try { extracted = (await pdf(first)).text; } catch { extracted = '[Non-PDF file uploaded or parse failed]'; }

      const userPrompt =
        `CLAIM META:\n${JSON.stringify(meta)}\n\nCARRIER ESTIMATE / DOC TEXT:\n${extracted}\n\n` +
        `Return strict JSON with keys: findings, code_citations, price_deltas, supplement_recommendation, supplement_letter.`;

      const completion = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          { role: "system", content: TBM_SYSTEM_PROMPT },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.2
      });

      const raw = completion.choices[0]?.message?.content?.trim() || "{}";
      let json: any;
      try { json = JSON.parse(raw); }
      catch { json = { findings: [], code_citations: [], price_deltas: [], supplement_recommendation: "", supplement_letter: raw }; }

      return res.status(200).json(json);
    } catch (e:any) {
      return res.status(500).json({ error: e?.message || 'Analyze error' });
    }
  }

  if (req.method === 'POST') return okNoContent(res);
  return res.status(405).json({ error: 'Method not allowed' });
}
