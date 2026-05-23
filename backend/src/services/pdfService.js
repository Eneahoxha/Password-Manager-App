const PDFDocument = require('pdfkit');

function createRecoveryPdfStream({ email, recoveryCode }) {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  doc.fontSize(20).text('SecureVault - Codice di recupero', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`Email: ${email}`);
  doc.moveDown();
  doc.fontSize(16).text(`Codice di recupero: ${recoveryCode}`, { underline: true });
  doc.moveDown();
  doc.fontSize(10).text('Conserva questo codice in un luogo sicuro. Ti servirà per resettare la master password se non la ricordi.', { width: 450 });
  doc.end();
  return doc;
}

module.exports = { createRecoveryPdfStream };
