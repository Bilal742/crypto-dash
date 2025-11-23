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
    <div className="min-h-screen bg-gray-900 text-gray-100 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">CryptoDash</h1>
            <p className="text-sm text-gray-400">Live prices · charts · market data</p>
          </div>

          <div className="w-full sm:w-auto flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="relative w-full sm:w-64">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Search coin…"
                className="pl-10 pr-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-sm w-full focus:outline-none"
              />
            </div>
          </div>
        </header>

        {/* TABLE HEADER (Desktop Only) */}
        <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2 text-xs text-gray-400 border-b border-gray-700">
          <div className="col-span-4">Coin</div>
          <div className="col-span-2">Price</div>
          <div className="col-span-2">24h</div>
          <div className="col-span-2">Market Cap</div>
          <div className="col-span-2">Volume</div>
          <div className="col-span-2">7d</div>
        </div>

        <main className="bg-gray-800 rounded-xl shadow-lg p-3 sm:p-4">

          {loading ? (
            <div className="p-8 text-center text-gray-300">Loading prices...</div>
          ) : error ? (
            <div className="p-6 text-center text-red-400">Error: {error}</div>
          ) : (
            <ul className="space-y-3">
              {filtered.items.map((c) => (
                <li
                  key={c.id}
                  className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center p-4 bg-gray-850 hover:bg-gray-800 rounded-xl"
                >
                  {/* Coin */}
                  <div className="md:col-span-4 flex items-center gap-3">
                    <img src={c.image} alt={c.name} className="w-9 h-9 rounded-full" />
                    <div>
                      <div className="font-medium">{c.name}</div>
                      <div className="text-xs text-gray-400 uppercase">{c.symbol}</div>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="md:col-span-2">
                    <div className="font-medium text-lg">${c.current_price.toLocaleString()}</div>
                    <div className="text-xs text-gray-400">USD</div>
                  </div>

                  {/* Change */}
                  <div className="md:col-span-2">
                    <div
                      className={`font-medium text-lg ${
                        c.price_change_percentage_24h >= 0
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {c.price_change_percentage_24h
                        ? c.price_change_percentage_24h.toFixed(2) + "%"
                        : "-"}
                    </div>
                  </div>

                  {/* Market Cap */}
                  <div className="md:col-span-2 text-sm">
                    ${c.market_cap?.toLocaleString() || "-"}
                  </div>

                  {/* Volume */}
                  <div className="md:col-span-2 text-sm">
                    ${c.total_volume?.toLocaleString() || "-"}
                  </div>

                  {/* Sparkline Chart */}
                  <div className="md:col-span-2 w-full flex justify-center">
                    <div className="w-full max-w-[150px] h-[50px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={c.sparkline.map((v, i) => ({ idx: i, v }))}
                        >
                          <XAxis dataKey="idx" hide />
                          <YAxis hide domain={["dataMin", "dataMax"]} />
                          <ReTooltip
                            labelFormatter={(l) => `Point ${l}`}
                            formatter={(value) => [`$${value.toFixed(2)}`]}
                          />
                          <Line
                            type="monotone"
                            dataKey="v"
                            dot={false}
                            strokeWidth={2}
                            stroke="#60a5fa"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-3">
            <div className="text-sm text-gray-400">
              Showing {(page - 1) * perPage + 1} -{" "}
              {(page - 1) * perPage + filtered.items.length} of {filtered.total}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 rounded bg-gray-700 disabled:opacity-50"
              >
                Prev
              </button>

              <div className="px-3 py-1 rounded bg-gray-700">
                {page} / {totalPages}
              </div>

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 rounded bg-gray-700 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
