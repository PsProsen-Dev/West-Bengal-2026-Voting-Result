'use client';

import { useEffect, useMemo, useState } from 'react';
import { Analytics } from '@vercel/analytics/react';

const ECI_SOURCE_URL = 'https://results.eci.gov.in/ResultAcGenMay2026/partywiseresult-S25.htm';
const ROUND_WISE_SOURCES = [
  {
    ac: '169',
    label: 'AC 169 Round-wise Result',
    url: 'https://results.eci.gov.in/ResultAcGenMay2026/RoundwiseS25169.htm?ac=169'
  },
  {
    ac: '159',
    label: 'AC 159 Round-wise Result',
    url: 'https://results.eci.gov.in/ResultAcGenMay2026/RoundwiseS25159.htm'
  }
];

const OFFICIAL_ECI_SNAPSHOT = {
  state: 'West Bengal',
  totalAC: 294,
  totalSeats: 293,
  won: 7,
  leading: 286,
  lastUpdated: '04:24 PM On 04/05/2026',
  sourceNote: 'Official ECI screenshot snapshot supplied from the Election Commission of India results page.',
  parties: [
    { party: 'Bharatiya Janata Party - BJP', short: 'BJP', won: 6, leading: 193, total: 199, tone: 'orange' },
    { party: 'All India Trinamool Congress - AITC', short: 'AITC', won: 1, leading: 87, total: 88, tone: 'slate' },
    { party: 'Indian National Congress - INC', short: 'INC', won: 0, leading: 2, total: 2, tone: 'cyan' },
    { party: 'Aam Janata Unnayan party - AJUP', short: 'AJUP', won: 0, leading: 2, total: 2, tone: 'blue' },
    { party: 'Communist Party of India (Marxist) - CPI(M)', short: 'CPI(M)', won: 0, leading: 1, total: 1, tone: 'red' },
    { party: 'All India Secular Front - AISF', short: 'AISF', won: 0, leading: 1, total: 1, tone: 'green' }
  ]
};

export default function Page() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadResults() {
      try {
        setLoading(true);
        setError('');
        const response = await fetch('/api/results', { cache: 'no-store' });
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || 'Unable to fetch official ECI data');
        setData(body);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadResults();
  }, []);

  const liveParties = data?.parties || [];
  const parties = liveParties.length ? liveParties.map((party) => ({ ...party, short: party.party })) : OFFICIAL_ECI_SNAPSHOT.parties;
  const roundWiseSources = data?.roundWiseSources?.length ? data.roundWiseSources : ROUND_WISE_SOURCES;
  const maxSeats = useMemo(() => Math.max(...parties.map((party) => party.total || party.won || 0), 1), [parties]);
  const leader = parties[0];
  const usingSnapshot = !liveParties.length;

  return (
    <main>
      <section className="hero">
        <div className="badge">Official ECI only • West Bengal S25</div>
        <h1>West Bengal 2026 Voting Result</h1>
        <p>
          Party-wise election result dashboard for West Bengal Assembly Constituencies. Live server fetch is attempted from ECI;
          when ECI blocks server access, this page shows the official ECI screenshot snapshot supplied here, with direct ECI source links.
        </p>
        <div className="meta">
          <a href={ECI_SOURCE_URL} target="_blank" rel="noreferrer">
            Open official ECI source ↗
          </a>
          <span>{data?.fetchedAt ? `Live fetch: ${new Date(data.fetchedAt).toLocaleString()}` : `Snapshot updated: ${OFFICIAL_ECI_SNAPSHOT.lastUpdated}`}</span>
        </div>
      </section>

      {error && (
        <div className="alert">
          <strong>Live ECI server fetch unavailable. Showing official ECI screenshot snapshot.</strong>
          <span>{error}</span>
          <small>No third-party data, mirror data, or guessed numbers are used.</small>
        </div>
      )}

      <section className="partyCards">
        {OFFICIAL_ECI_SNAPSHOT.parties.map((party) => (
          <div className={`partyCard ${party.tone}`} key={party.short}>
            <span>{party.short}</span>
            <strong>{party.total}</strong>
          </div>
        ))}
      </section>

      <section className="cards">
        <div className="card">
          <span>State</span>
          <strong>{data?.state || OFFICIAL_ECI_SNAPSHOT.state}</strong>
        </div>
        <div className="card">
          <span>Total AC</span>
          <strong>{OFFICIAL_ECI_SNAPSHOT.totalAC}</strong>
        </div>
        <div className="card">
          <span>Leading Party</span>
          <strong>{leader?.short || leader?.party || '—'}</strong>
        </div>
      </section>

      <section className="panel">
        <div className="panelHeader">
          <div>
            <h2>Party-wise Results</h2>
            <p>{usingSnapshot ? OFFICIAL_ECI_SNAPSHOT.sourceNote : 'Live parsed from official ECI West Bengal page: S25'}</p>
          </div>
          <div className="pill">{loading ? 'Loading' : usingSnapshot ? 'Official snapshot' : `${parties.length} parties`}</div>
        </div>

        <div className="resultTable">
          <div className="resultHead">
            <span>Party</span>
            <span>Won</span>
            <span>Leading</span>
            <span>Total</span>
          </div>
          {parties.map((party) => (
            <div className="resultLine" key={party.party}>
              <span>{party.party}</span>
              <span>{party.won}</span>
              <span>{party.leading}</span>
              <span>{party.total}</span>
            </div>
          ))}
          <div className="resultLine totalLine">
            <span>Total</span>
            <span>{OFFICIAL_ECI_SNAPSHOT.won}</span>
            <span>{OFFICIAL_ECI_SNAPSHOT.leading}</span>
            <span>{OFFICIAL_ECI_SNAPSHOT.totalSeats}</span>
          </div>
        </div>

        <div className="table">
          {parties.map((party, index) => {
            const value = party.total || party.won || 0;
            return (
              <div className="row" key={`${party.party}-${index}`}>
                <div className="rank">#{index + 1}</div>
                <div className="party">
                  <strong>{party.short || party.party}</strong>
                  <small>Won {party.won} • Leading {party.leading}</small>
                </div>
                <div className="bar" aria-label={`${party.party} seats`}>
                  <span style={{ width: `${Math.max(4, (value / maxSeats) * 100)}%` }} />
                </div>
                <div className="seats">{value}</div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="panel">
        <div className="panelHeader">
          <div>
            <h2>Official ECI Source Links</h2>
            <p>Direct links from Election Commission of India. No third-party source is used.</p>
          </div>
          <div className="pill">{roundWiseSources.length + 1} ECI links</div>
        </div>
        <div className="roundGrid">
          <a className="roundCard" href={ECI_SOURCE_URL} target="_blank" rel="noreferrer">
            <span>West Bengal • S25 • Party-wise</span>
            <strong>Party-wise Result</strong>
            <small>{ECI_SOURCE_URL}</small>
          </a>
          {roundWiseSources.map((source) => (
            <a className="roundCard" href={source.url} target="_blank" rel="noreferrer" key={source.url}>
              <span>West Bengal • S25 • AC {source.ac}</span>
              <strong>{source.label}</strong>
              <small>{source.url}</small>
            </a>
          ))}
        </div>
      </section>

      <footer>
        Official source: Election Commission of India • West Bengal code S25 • Last updated {OFFICIAL_ECI_SNAPSHOT.lastUpdated}
      </footer>
      <Analytics />
    </main>
  );
}
