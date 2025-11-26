import type { VercelRequest, VercelResponse } from '@vercel/node';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { PROVISIONAL_PATENT_TEXT } from './provisional-patent-text';

function unauthorized(res: VercelResponse) {
  return res.status(401).json({ error: 'Unauthorized' });
}

function drawHeader(doc: PDFDocument, margin: number) {
  const width = doc.page.width;
  const headerY = margin / 1.5;

  doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor('#111')
    .text('TBM – Provisional Patent Application', margin, headerY, { width: width - margin * 2, align: 'left' })
    .text(`Page ${doc.page.number}`, margin, headerY, { width: width - margin * 2, align: 'right' });

  doc
    .moveTo(margin, headerY + 12)
    .lineTo(width - margin, headerY + 12)
    .lineWidth(0.5)
    .strokeColor('#d5d5d5')
    .stroke();

  doc.moveDown();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const hdr = req.headers['x-tbm-auth'] as string | undefined;
  if (!hdr) return unauthorized(res);
  const [user, pass] = Buffer.from(hdr, 'base64').toString('utf8').split(':');
  if (user !== process.env.TBM_LOGIN_USER || pass !== process.env.TBM_LOGIN_PASS) return unauthorized(res);

  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="TBM_Provisional_Patent_FullLength.pdf"');

  const margin = 0.75 * 72; // 0.75 inch
  const doc = new PDFDocument({ size: 'LETTER', margin });

  doc.on('pageAdded', () => drawHeader(doc, margin));
  drawHeader(doc, margin);

  doc.pipe(res);

  const usableWidth = doc.page.width - margin * 2;
  PROVISIONAL_PATENT_TEXT.trim().split('\n\n').forEach((para) => {
    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor('#111')
      .text(para, { width: usableWidth, align: 'left' });
    doc.moveDown();
  });

  const figures = [
    '/mnt/data/A_set_of_six_technical_patent-style_line_drawings_.png',
    '/mnt/data/A_flowchart-style_diagram_in_black_and_white_title.png',
  ];

  figures.forEach((figPath) => {
    if (!fs.existsSync(figPath)) return;
    doc.addPage();
    const img = fs.readFileSync(figPath);
    const imgPath = path.basename(figPath);
    const { width: pageWidth, height: pageHeight } = doc.page;

    doc.image(img, margin, margin, {
      fit: [pageWidth - margin * 2, pageHeight - margin * 2],
      align: 'center',
      valign: 'center',
    });
    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor('#111')
      .text(imgPath, margin, margin / 2, { width: pageWidth - margin * 2, align: 'center' });
  });

  doc.end();
}
