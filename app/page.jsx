'use client';

import { useEffect, useMemo, useState } from 'react';
import { Analytics } from '@vercel/analytics/react';

const ECI_SOURCE_URL = 'https://results.eci.gov.in/ResultAcGenMay2026/partywiseresult-S25.htm';

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

  const parties = data?.parties || [];
  const maxSeats = useMemo(() => Math.max(...parties.map((party) => party.total || party.won || 0), 1), [parties]);
  const leader = parties[0];

  return (
    <main>
      <section className="hero">
        <div className="badge">Official ECI only • West Bengal S25</div>
        <h1>West Bengal 2026 Voting Result</h1>
        <p>
          Party-wise election result dashboard built from the official Election Commission of India
          result page only. No third-party data source or cached fallback is used.
        </p>
        <div className="meta">
          <a href={ECI_SOURCE_URL} target="_blank" rel="noreferrer">
            Open official ECI source ↗
          </a>
          <span>{data?.fetchedAt ? `Updated: ${new Date(data.fetchedAt).toLocaleString()}` : 'Fetching official ECI data...'}</span>
        </div>
      </section>

      {error && (
        <div className="alert">
          <strong>Official ECI server-side fetch blocked.</strong>
          <span>{error}</span>
          <small>The app intentionally does not show third-party, scraped mirror, cached, or guessed data.</small>
        </div>
      )}

      <section className="cards">
        <div className="card">
          <span>State</span>
          <strong>{data?.state || 'West Bengal'}</strong>
        </div>
        <div className="card">
          <span>Total Seats Parsed</span>
          <strong>{data?.totalSeats ?? '—'}</strong>
        </div>
        <div className="card">
          <span>Leading Party</span>
          <strong>{leader?.party || '—'}</strong>
        </div>
      </section>

      <section className="panel">
        <div className="panelHeader">
          <div>
            <h2>Party-wise Results</h2>
            <p>Source locked to official ECI West Bengal page: S25</p>
          </div>
          <div className="pill">{loading ? 'Loading' : parties.length ? `${parties.length} parties` : 'Official view'}</div>
        </div>

        {loading && !error && <p className="muted">Loading latest data from Election Commission of India...</p>}

        {error && (
          <div className="officialFallback">
            <h3>Use official ECI source directly</h3>
            <p>
              ECI is returning HTTP 403 to the Vercel server request. To keep data integrity strict,
              this site will not use proxies, mirrors, third-party APIs, or fake fallback numbers.
            </p>
            <a href={ECI_SOURCE_URL} target="_blank" rel="noreferrer">Open West Bengal official ECI result page</a>
            <iframe title="Official ECI West Bengal Result" src={ECI_SOURCE_URL} />
          </div>
        )}

        {!error && (
          <div className="table">
            {parties.map((party, index) => {
              const value = party.total || party.won || 0;
              return (
                <div className="row" key={`${party.party}-${index}`}>
                  <div className="rank">#{index + 1}</div>
                  <div className="party">
                    <strong>{party.party}</strong>
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
        )}
      </section>

      <footer>
        Official source: Election Commission of India • West Bengal code S25 • No third-party data
      </footer>
      <Analytics />
    </main>
  );
}
