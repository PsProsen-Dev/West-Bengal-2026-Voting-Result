// Official ECI Browser Extractor
// Usage:
// 1. Open an official ECI results page in your browser, for example:
//    https://results.eci.gov.in/ResultAcGenMay2026/partywiseresult-S25.htm
//    https://results.eci.gov.in/ResultAcGenMay2026/RoundwiseS25159.htm
// 2. Open DevTools Console.
// 3. Paste this whole script and press Enter.
// 4. A JSON file will download automatically.
//
// This runs inside your browser on the official ECI page. It does not use third-party APIs,
// mirrors, proxies, or guessed data.

(() => {
  const absolutize = (href) => {
    try {
      return new URL(href, location.href).href;
    } catch {
      return href || '';
    }
  };

  const clean = (value) => String(value || '')
    .replace(/\s+/g, ' ')
    .replace(/\u00a0/g, ' ')
    .trim();

  const tables = [...document.querySelectorAll('table')].map((table, tableIndex) => {
    const rows = [...table.querySelectorAll('tr')].map((tr) => {
      const cells = [...tr.querySelectorAll('th,td')].map((cell) => clean(cell.innerText));
      const links = [...tr.querySelectorAll('a[href]')].map((a) => ({
        text: clean(a.innerText),
        href: absolutize(a.getAttribute('href')),
      }));
      return { cells, links };
    }).filter((row) => row.cells.some(Boolean) || row.links.length);

    return { tableIndex, rows };
  }).filter((table) => table.rows.length);

  const cards = [...document.querySelectorAll('div,section,article,li')]
    .map((node) => clean(node.innerText))
    .filter((text) => text && text.length <= 160)
    .filter((text, index, array) => array.indexOf(text) === index)
    .filter((text) => /\b(BJP|AITC|INC|AJUP|CPI|AISF|Won|Leading|Total|West Bengal|AC|Round|Candidate|Party)\b/i.test(text));

  const links = [...document.querySelectorAll('a[href]')].map((a) => ({
    text: clean(a.innerText),
    href: absolutize(a.getAttribute('href')),
  })).filter((link, index, array) => link.href && array.findIndex((item) => item.href === link.href && item.text === link.text) === index);

  const selects = [...document.querySelectorAll('select')].map((select, selectIndex) => ({
    selectIndex,
    name: select.name || select.id || '',
    options: [...select.options].map((option) => ({
      text: clean(option.text),
      value: option.value,
      href: absolutize(option.value),
    })).filter((option) => option.text || option.value),
  }));

  const partyRows = [];
  for (const table of tables) {
    for (const row of table.rows) {
      const cells = row.cells;
      if (cells.length < 4) continue;
      const joined = cells.join(' ').toLowerCase();
      if (joined.includes('party') && joined.includes('won')) continue;
      const numeric = cells.map((cell) => Number(cell.replace(/[^0-9]/g, ''))).filter((num) => Number.isFinite(num) && num >= 0);
      if (numeric.length < 3) continue;
      const party = cells.find((cell) => /[A-Za-z]/.test(cell) && !/^\d+$/.test(cell.replace(/,/g, '')));
      if (!party) continue;
      partyRows.push({
        party,
        won: numeric[numeric.length - 3],
        leading: numeric[numeric.length - 2],
        total: numeric[numeric.length - 1],
        rawCells: cells,
      });
    }
  }

  const extracted = {
    source: 'Official Election Commission of India page opened in browser',
    url: location.href,
    title: document.title,
    extractedAt: new Date().toISOString(),
    textSample: clean(document.body.innerText).slice(0, 5000),
    partyRows,
    tables,
    links,
    selects,
    cards,
  };

  console.log('ECI Extracted JSON:', extracted);

  const blob = new Blob([JSON.stringify(extracted, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  const safeName = location.pathname.split('/').filter(Boolean).join('_').replace(/[^a-z0-9_.-]+/gi, '_') || 'eci-results';
  a.href = URL.createObjectURL(blob);
  a.download = `${safeName}_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(a.href);
})();
