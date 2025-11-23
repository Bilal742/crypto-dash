import React, { useEffect, useState, useMemo } from "react";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip as ReTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { FiSearch } from "react-icons/fi";

export default function CryptoDashboard() {
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");
  const [perPage] = useState(20);
  const [page, setPage] = useState(1);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    const controller = new AbortController();

    fetch(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=true&price_change_percentage=24h`,
      { signal: controller.signal }
    )
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (!mounted) return;
        const normalized = data.map((c) => ({
          id: c.id,
          symbol: c.symbol,
          name: c.name,
          image: c.image,
          current_price: c.current_price,
          market_cap: c.market_cap,
          total_volume: c.total_volume,
          price_change_percentage_24h: c.price_change_percentage_24h,
          sparkline: (c.sparkline_in_7d && c.sparkline_in_7d.price) || [],
        }));
        setCoins(normalized);
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        setError(err.message || "Failed to fetch");
      })
      .finally(() => setLoading(false));

    return () => {
      mounted = false;
      controller.abort();
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const f = coins.filter(
      (c) =>
        c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q)
    );
    const start = (page - 1) * perPage;
    return {
      total: f.length,
      items: f.slice(start, start + perPage),
    };
  }, [coins, query, page, perPage]);

  const totalPages = Math.max(1, Math.ceil((filtered.total || 0) / perPage));

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">CryptoDash</h1>
            <p className="text-sm text-gray-400">Live prices · sparkline · market data</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Search coin or symbol (e.g. bitcoin, BTC)"
                className="pl-10 pr-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-sm w-64 focus:outline-none"
              />
            </div>

            <div className="text-right text-sm text-gray-400">
              <div>Updated from CoinGecko</div>
              <div className="text-xs">No API key required (rate limits apply)</div>
            </div>
          </div>
        </header>

        <main className="bg-gray-800 rounded-2xl shadow-lg p-4">
          <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2 text-xs text-gray-400 border-b border-gray-700">
            <div className="col-span-4">Coin</div>
            <div className="col-span-2">Price</div>
            <div className="col-span-2">24h</div>
            <div className="col-span-2">Market Cap</div>
            <div className="col-span-2">Volume</div>
            <div className="col-span-2">7d</div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-300">Loading prices...</div>
          ) : error ? (
            <div className="p-6 text-center text-red-400">Error: {error}</div>
          ) : (
            <div>
              <ul>
                {filtered.items.map((c) => (
                  <li
                    key={c.id}
                    className="grid grid-cols-12 gap-4 items-center px-4 py-3 hover:bg-gray-850 rounded-lg"
                  >
                    <div className="col-span-4 flex items-center gap-3">
                      <img src={c.image} alt={c.name} className="w-8 h-8 rounded-full" />
                      <div>
                        <div className="font-medium">{c.name}</div>
                        <div className="text-xs text-gray-400 uppercase">{c.symbol}</div>
                      </div>
                    </div>

                    <div className="col-span-2">
                      <div className="font-medium">${c.current_price.toLocaleString()}</div>
                      <div className="text-xs text-gray-400">USD</div>
                    </div>

                    <div className="col-span-2">
                      <div
                        className={`font-medium ${
                          c.price_change_percentage_24h >= 0 ? "text-green-400" : "text-red-400"
                        }`}
                      >
                        {c.price_change_percentage_24h
                          ? c.price_change_percentage_24h.toFixed(2) + "%"
                          : "-"}
                      </div>
                    </div>

                    <div className="col-span-2 text-sm">
                      ${c.market_cap ? c.market_cap.toLocaleString() : "-"}
                    </div>

                    <div className="col-span-2 text-sm">
                      ${c.total_volume ? c.total_volume.toLocaleString() : "-"}
                    </div>

                    <div className="col-span-2">
                      <div style={{ width: 120, height: 40 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={c.sparkline.map((v, i) => ({ idx: i, v }))}
                            margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                          >
                            <XAxis dataKey="idx" hide />
                            <YAxis hide domain={["dataMin", "dataMax"]} />
                            <ReTooltip
                              labelFormatter={(l) => `Point ${l}`}
                              formatter={(value) => [`$${value.toFixed(2)}`]}
                            />
                            <Line type="monotone" dataKey="v" dot={false} strokeWidth={2} stroke="#60a5fa" />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-400">Showing {(page - 1) * perPage + 1} - {(page - 1) * perPage + filtered.items.length} of {filtered.total}</div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 cursor-pointer rounded bg-gray-700 disabled:opacity-50"
                  >
                    Prev
                  </button>
                  <div className="px-3 py-1 rounded bg-gray-700">{page} / {totalPages}</div>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 cursor-pointer py-1 rounded bg-gray-700 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>

        <footer className="mt-6 text-sm text-gray-400">
          Pro tip: Add Firebase auth + Firestore to keep user watchlists, or integrate WebSockets for near-real-time updates.
        </footer>
      </div>
    </div>
  );
}
