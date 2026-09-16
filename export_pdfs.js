const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = __dirname;
const outputDir = path.join(rootDir, 'docs_pdf');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Find all stage files and summary documents
const stageFiles = [
  'README.md',
  'STAGE_2_PRODUCTION_ERD.md',
  'STAGE_3_RBAC_PERMISSION_MATRIX.md',
  'STAGE_4_API_SPECIFICATION.md',
  'STAGE_5_MODULAR_MONOLITH_ARCHITECTURE.md',
  'STAGE_6_AUTHENTICATION_AND_SESSION_MANAGEMENT.md',
  'STAGE_7_VENDOR_MANAGEMENT_AND_MULTI_TENANCY.md',
  'STAGE_8_PRODUCT_CATALOG_AND_CATEGORY_HIERARCHY.md',
  'STAGE_9_SEARCH_FILTERING_AND_FACETS.md',
  'STAGE_10_INVENTORY_MANAGEMENT_AND_STOCK_CONTROL.md',
  'STAGE_11_SHOPPING_CART_AND_SAVED_FOR_LATER.md',
  'STAGE_12_ORDER_MANAGEMENT_AND_SUBORDERS.md',
  'STAGE_13_PAYMENTS_MULTI_CURRENCY_ESCROW_AND_WEBHOOKS.md',
  'STAGE_14_LOGISTICS_SHIPPING_AND_TRACKING.md',
  'STAGE_15_RETURNS_REFUNDS_RMAS_AND_REVERSE_LOGISTICS.md',
  'STAGE_16_COUPONS_PROMOTIONS_AND_FLASH_DEALS.md',
  'STAGE_17_REVIEWS_RATINGS_UGC_AND_QA.md',
  'STAGE_18_NOTIFICATIONS_AND_SUPPORT_HELPDESK.md',
  'STAGE_19_VENDOR_SETTLEMENTS_PAYOUTS_AND_LEDGER.md',
  'STAGE_20_PRODUCTION_HARDENING_AND_DEPLOYMENT.md',
  'FINAL_PRODUCTION_READINESS_REPORT.md'
];

function markdownToHtml(md) {
  // Simple, robust markdown to HTML converter for technical docs
  let html = md;

  // Escape HTML entities inside inline code or text
  html = html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // Code blocks ```lang ... ```
  html = html.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (match, lang, code) => {
    return `<div class="code-container"><div class="code-header">${lang || 'text'}</div><pre><code>${code.trim()}</code></pre></div>`;
  });

  // Inline code `...`
  html = html.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

  // Headings
  html = html.replace(/^#### (.*$)/gim, '<h4>$1</h4>');
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

  // Bold & Italic
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  // Links [text](url)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // Horizontal rules
  html = html.replace(/^---$/gim, '<hr/>');

  // Blockquotes
  html = html.replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>');

  // Tables
  const lines = html.split('\n');
  let inTable = false;
  let tableHtml = '';
  let finalLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('|') && line.endsWith('|')) {
      if (!inTable) {
        inTable = true;
        tableHtml = '<div class="table-container"><table>';
        // Header
        const headers = line.split('|').filter(c => c.length > 0).map(c => `<th>${c.trim()}</th>`).join('');
        tableHtml += `<thead><tr>${headers}</tr></thead><tbody>`;
        // Skip separator line if next
        if (i + 1 < lines.length && lines[i + 1].includes('---')) {
          i++;
        }
      } else {
        const cells = line.split('|').filter((_, idx, arr) => idx > 0 && idx < arr.length - 1).map(c => `<td>${c.trim()}</td>`).join('');
        tableHtml += `<tr>${cells}</tr>`;
      }
    } else {
      if (inTable) {
        tableHtml += '</tbody></table></div>';
        finalLines.push(tableHtml);
        inTable = false;
        tableHtml = '';
      }
      finalLines.push(lines[i]);
    }
  }
  if (inTable) {
    tableHtml += '</tbody></table></div>';
    finalLines.push(tableHtml);
  }

  html = finalLines.join('\n');

  // Lists
  html = html.replace(/^- \[x\] (.*$)/gim, '<div class="checkbox-item checked"><span class="check-box">☑</span> $1</div>');
  html = html.replace(/^- \[ \] (.*$)/gim, '<div class="checkbox-item unchecked"><span class="check-box">☐</span> $1</div>');
  html = html.replace(/^\- (.*$)/gim, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/gis, '<ul>$1</ul>');
  html = html.replace(/<\/ul>\s*<ul>/g, '');

  // Paragraphs
  const paragraphs = html.split(/\n\n+/);
  html = paragraphs.map(p => {
    p = p.trim();
    if (p.startsWith('<h') || p.startsWith('<div') || p.startsWith('<table') || p.startsWith('<ul') || p.startsWith('<pre') || p.startsWith('<blockquote') || p.startsWith('<hr')) {
      return p;
    }
    return `<p>${p.replace(/\n/g, '<br/>')}</p>`;
  }).join('\n');

  return html;
}

function getStyledHtmlDocument(title, bodyContent) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');
    
    @page {
      size: A4;
      margin: 20mm 15mm 20mm 15mm;
      @bottom-right {
        content: counter(page);
        font-family: 'Inter', sans-serif;
        font-size: 8pt;
        color: #64748b;
      }
    }

    * {
      box-sizing: border-box;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 10pt;
      line-height: 1.6;
      color: #1e293b;
      background: #ffffff;
      margin: 0;
      padding: 0;
    }

    .doc-header {
      border-bottom: 2px solid #064e3b;
      padding-bottom: 12px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .doc-brand {
      font-size: 14pt;
      font-weight: 800;
      color: #064e3b;
      letter-spacing: -0.5px;
    }

    .doc-badge {
      background: #ecfdf5;
      color: #065f46;
      border: 1px solid #a7f3d0;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 8pt;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    h1 {
      font-size: 18pt;
      font-weight: 800;
      color: #0f172a;
      margin-top: 0;
      margin-bottom: 14px;
      line-height: 1.25;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 8px;
    }

    h2 {
      font-size: 13pt;
      font-weight: 700;
      color: #064e3b;
      margin-top: 20px;
      margin-bottom: 10px;
      padding-bottom: 4px;
      border-bottom: 1px solid #f1f5f9;
      page-break-after: avoid;
    }

    h3 {
      font-size: 11pt;
      font-weight: 600;
      color: #334155;
      margin-top: 14px;
      margin-bottom: 6px;
      page-break-after: avoid;
    }

    h4 {
      font-size: 10pt;
      font-weight: 600;
      color: #475569;
      margin-top: 10px;
      margin-bottom: 4px;
    }

    p {
      margin-top: 0;
      margin-bottom: 10px;
      text-align: justify;
    }

    a {
      color: #047857;
      text-decoration: none;
      font-weight: 500;
    }

    strong {
      color: #0f172a;
      font-weight: 600;
    }

    ul, ol {
      margin-top: 0;
      margin-bottom: 12px;
      padding-left: 20px;
    }

    li {
      margin-bottom: 4px;
    }

    .checkbox-item {
      display: flex;
      align-items: flex-start;
      margin-bottom: 4px;
      font-size: 9.5pt;
    }

    .check-box {
      font-family: 'JetBrains Mono', monospace;
      margin-right: 6px;
      color: #059669;
      font-weight: bold;
    }

    .inline-code {
      font-family: 'JetBrains Mono', Consolas, monospace;
      font-size: 8.5pt;
      background: #f1f5f9;
      color: #881337;
      padding: 2px 5px;
      border-radius: 4px;
      border: 1px solid #e2e8f0;
    }

    .code-container {
      margin: 12px 0;
      border-radius: 6px;
      overflow: hidden;
      border: 1px solid #cbd5e1;
      background: #0f172a;
      page-break-inside: avoid;
    }

    .code-header {
      background: #1e293b;
      color: #94a3b8;
      font-family: 'JetBrains Mono', monospace;
      font-size: 7.5pt;
      padding: 4px 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 1px solid #334155;
    }

    pre {
      margin: 0;
      padding: 10px 14px;
      background: #0f172a;
      color: #f8fafc;
      font-family: 'JetBrains Mono', Consolas, monospace;
      font-size: 8pt;
      line-height: 1.45;
      overflow-x: auto;
      white-space: pre-wrap;
      word-break: break-all;
    }

    .table-container {
      margin: 14px 0;
      width: 100%;
      overflow: hidden;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      page-break-inside: avoid;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8.5pt;
    }

    th {
      background: #f8fafc;
      color: #0f172a;
      font-weight: 700;
      text-align: left;
      padding: 8px 10px;
      border-bottom: 2px solid #cbd5e1;
      border-right: 1px solid #e2e8f0;
    }

    th:last-child {
      border-right: none;
    }

    td {
      padding: 6px 10px;
      border-bottom: 1px solid #e2e8f0;
      border-right: 1px solid #e2e8f0;
      vertical-align: top;
    }

    td:last-child {
      border-right: none;
    }

    tr:nth-child(even) td {
      background: #f8fafc;
    }

    tr:last-child td {
      border-bottom: none;
    }

    blockquote {
      margin: 12px 0;
      padding: 8px 14px;
      background: #f0fdf4;
      border-left: 4px solid #10b981;
      color: #065f46;
      font-size: 9.5pt;
      border-radius: 0 4px 4px 0;
    }

    hr {
      border: none;
      border-top: 1px solid #e2e8f0;
      margin: 18px 0;
    }

    .page-break {
      page-break-before: always;
    }
  </style>
</head>
<body>
  <div class="doc-header">
    <div class="doc-brand">ALIGHT INTERNATIONAL MARKETPLACE</div>
    <div class="doc-badge">Production Grade Specification</div>
  </div>
  ${bodyContent}
</body>
</html>`;
}

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

console.log('Starting PDF Export of All Stages...');

const generatedPdfs = [];
let combinedHtmlContent = '';

for (const file of stageFiles) {
  const filePath = path.join(rootDir, file);
  if (!fs.existsSync(filePath)) {
    console.warn(`File not found: ${file}`);
    continue;
  }

  const rawMd = fs.readFileSync(filePath, 'utf8');
  const title = file.replace(/\.md$/, '').replace(/_/g, ' ');
  const htmlContent = markdownToHtml(rawMd);
  const fullHtml = getStyledHtmlDocument(title, htmlContent);

  const tempHtmlPath = path.join(outputDir, `${file.replace(/\.md$/, '')}.html`);
  const pdfOutPath = path.join(outputDir, `${file.replace(/\.md$/, '')}.pdf`);

  fs.writeFileSync(tempHtmlPath, fullHtml, 'utf8');

  // Convert HTML to PDF via Edge Headless
  try {
    const cmd = `"${edgePath}" --headless --disable-gpu --run-all-compositor-stages-before-draw --print-to-pdf="${pdfOutPath}" "${tempHtmlPath}"`;
    execSync(cmd, { stdio: 'ignore' });
    generatedPdfs.push(pdfOutPath);
    console.log(`[OK] Exported: ${path.basename(pdfOutPath)}`);
  } catch (err) {
    console.error(`[ERROR] Failed exporting ${file}:`, err.message);
  } finally {
    if (fs.existsSync(tempHtmlPath)) {
      fs.unlinkSync(tempHtmlPath);
    }
  }

  // Append for master unified document
  combinedHtmlContent += `<div class="stage-section">${htmlContent}</div><div class="page-break"></div>`;
}

// Generate Combined Master PDF
const masterHtml = getStyledHtmlDocument('Alight International Marketplace - Master Specification', combinedHtmlContent);
const masterHtmlPath = path.join(outputDir, 'ALIGHT_COMPLETE_MARKETPLACE_SPECIFICATION.html');
const masterPdfPath = path.join(outputDir, 'ALIGHT_COMPLETE_MARKETPLACE_SPECIFICATION.pdf');

fs.writeFileSync(masterHtmlPath, masterHtml, 'utf8');

try {
  const masterCmd = `"${edgePath}" --headless --disable-gpu --run-all-compositor-stages-before-draw --print-to-pdf="${masterPdfPath}" "${masterHtmlPath}"`;
  execSync(masterCmd, { stdio: 'ignore' });
  generatedPdfs.push(masterPdfPath);
  console.log(`[OK] Master Unified Manual: ${path.basename(masterPdfPath)}`);
} catch (err) {
  console.error('[ERROR] Failed exporting master manual:', err.message);
} finally {
  if (fs.existsSync(masterHtmlPath)) {
    fs.unlinkSync(masterHtmlPath);
  }
}

console.log(`\nSuccessfully exported ${generatedPdfs.length} PDFs to: ${outputDir}`);
