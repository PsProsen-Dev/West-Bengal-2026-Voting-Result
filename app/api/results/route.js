const ECI_WEST_BENGAL_PARTY_WISE_URL = 'https://results.eci.gov.in/ResultAcGenMay2026/partywiseresult-S25.htm';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function stripTags(value = '') {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseNumber(value) {
  const parsed = Number(String(value || '').replace(/[^0-9]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseRows(html) {
  const rows = [...html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)].map((match) => match[1]);
  const parties = [];

  for (const row of rows) {
    const cells = [...row.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((match) => stripTags(match[1]));
    if (cells.length < 2) continue;

    const joined = cells.join(' ').toLowerCase();
    if (joined.includes('party') && (joined.includes('won') || joined.includes('leading') || joined.includes('total'))) continue;
    if (joined.includes('total') && cells.length <= 3) continue;

    const numericIndexes = cells
      .map((cell, index) => ({ cell, index, number: parseNumber(cell) }))
      .filter((item) => /^\d+$/.test(String(item.cell).replace(/,/g, '').trim()));

    if (numericIndexes.length === 0) continue;

    const partyCell = cells.find((cell) => /[A-Za-z]/.test(cell) && !/^\d+$/.test(cell.replace(/,/g, '').trim()));
    if (!partyCell) continue;

    const numbers = numericIndexes.map((item) => item.number);
    let won = 0;
    let leading = 0;
    let total = 0;

    if (numbers.length >= 3) {
      won = numbers[numbers.length - 3];
      leading = numbers[numbers.length - 2];
      total = numbers[numbers.length - 1];
    } else if (numbers.length === 2) {
      won = numbers[0];
      total = numbers[1];
      leading = Math.max(total - won, 0);
    } else {
      total = numbers[0];
      won = numbers[0];
    }

    parties.push({
      party: partyCell,
      won,
      leading,
      total: total || won + leading
    });
  }

  return parties
    .filter((party, index, array) => party.party && array.findIndex((item) => item.party === party.party) === index)
    .sort((a, b) => (b.total || 0) - (a.total || 0));
}

export async function GET() {
  try {
    const response = await fetch(ECI_WEST_BENGAL_PARTY_WISE_URL, {
      cache: 'no-store',
      redirect: 'follow',
      headers: {
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'accept-language': 'en-IN,en;q=0.9,hi;q=0.8',
        'cache-control': 'no-cache',
        pragma: 'no-cache',
        referer: 'https://results.eci.gov.in/',
        origin: 'https://results.eci.gov.in',
        'upgrade-insecure-requests': '1'
      }
    });

    if (!response.ok) {
      throw new Error(`ECI returned HTTP ${response.status}. The official ECI server is blocking this deployment's server-side request.`);
    }

    const html = await response.text();
    const parties = parseRows(html);

    if (!parties.length) {
      throw new Error('No party-wise rows found on the official ECI West Bengal page.');
    }

    return Response.json({
      state: 'West Bengal',
      stateCode: 'S25',
      sourceType: 'Official Election Commission of India result page only',
      sourceUrl: ECI_WEST_BENGAL_PARTY_WISE_URL,
      fetchedAt: new Date().toISOString(),
      totalSeats: parties.reduce((sum, party) => sum + (party.total || 0), 0),
      parties
    });
  } catch (error) {
    return Response.json(
      {
        state: 'West Bengal',
        stateCode: 'S25',
        sourceType: 'Official Election Commission of India result page only',
        sourceUrl: ECI_WEST_BENGAL_PARTY_WISE_URL,
        fetchedAt: new Date().toISOString(),
        error: error.message,
        officialViewAvailable: true
      },
      { status: 502 }
    );
  }
}
