import React, { useEffect, useState, useMemo } from "react";
import { FiSearch } from "react-icons/fi";

export default function CryptoDashboard() {
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 15;

 
  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(
          "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1"
        );
        const data = await res.json();
        setCoins(data);
      } catch (err) {
        setError("Failed to fetch data");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);


  const filtered = useMemo(() => {
    const f = coins.filter(
      (coin) =>
        coin.name.toLowerCase().includes(query.toLowerCase()) ||
        coin.symbol.toLowerCase().includes(query.toLowerCase())
    );
    const start = (page - 1) * perPage;
    return {
      total: f.length,
      items: f.slice(start, start + perPage),
    };
  }, [coins, query, page]);

  const totalPages = Math.max(1, Math.ceil(filtered.total / perPage));

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row items-center justify-between mb-8">
          <div className="text-center md:text-left mb-4 md:mb-0">
            <h1 className="text-3xl font-bold tracking-tight text-white">
              CryptoDash
            </h1>
            <p className="text-sm text-gray-400">
              Live Cryptocurrency Market Data
            </p>
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
                placeholder="Search coin or symbol..."
                className="pl-10 pr-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-sm w-64 focus:outline-none"
              />
            </div>
          </div>
        </header>

        
        <main className="bg-gray-800 rounded-2xl shadow-lg p-4 overflow-x-auto">
          {loading ? (
            <div className="text-center text-gray-400 p-6">Loading data...</div>
          ) : error ? (
            <div className="text-center text-red-400 p-6">{error}</div>
          ) : (
            <table className="min-w-full text-sm">
              <thead className="text-gray-400 border-b border-gray-700 text-xs uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 text-left">Coin</th>
                  <th className="py-3 px-4 text-left">Price</th>
                  <th className="py-3 px-4 text-left">24h Change</th>
                  <th className="py-3 px-4 text-left">Market Cap</th>
                  <th className="py-3 px-4 text-left">Volume</th>
                  <th className="py-3 px-4 text-left">Trend</th>
                </tr>
              </thead>
              <tbody>
                {filtered.items.map((coin) => (
                  <tr
                    key={coin.id}
                    className="hover:bg-gray-850 transition-all duration-200 border-b border-gray-700"
                  >
                    <td className="py-3 px-4 flex items-center gap-3">
                      <img
                        src={coin.image}
                        alt={coin.name}
                        className="w-7 h-7 rounded-full"
                      />
                      <div>
                        <div className="font-medium text-white">{coin.name}</div>
                        <div className="text-xs text-gray-400 uppercase">
                          {coin.symbol}
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-gray-200">
                      ${coin.current_price.toLocaleString()}
                    </td>

                    <td
                      className={`py-3 px-4 font-semibold ${
                        coin.price_change_percentage_24h > 0
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {coin.price_change_percentage_24h?.toFixed(2)}%
                    </td>

                    <td className="py-3 px-4 text-gray-300">
                      ${coin.market_cap.toLocaleString()}
                    </td>

                    <td className="py-3 px-4 text-gray-300">
                      ${coin.total_volume.toLocaleString()}
                    </td>

                    <td className="py-3 px-4">
                      <div className="h-2 w-24 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-2 ${
                            coin.price_change_percentage_24h > 0
                              ? "bg-green-500"
                              : "bg-red-500"
                          }`}
                          style={{
                            width: `${Math.min(
                              Math.abs(coin.price_change_percentage_24h) * 2,
                              100
                            )}%`,
                          }}
                        ></div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </main>

        {!loading && !error && (
          <div className="flex items-center justify-between mt-5 text-gray-400 text-sm">
            <span>
              Showing {(page - 1) * perPage + 1} -{" "}
              {(page - 1) * perPage + filtered.items.length} of{" "}
              {filtered.total} coins
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 cursor-pointer rounded bg-gray-700 text-white disabled:opacity-40"
              >
                Prev
              </button>
              <span className="px-3 py-1 bg-gray-700 rounded">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 rounded cursor-pointer bg-gray-700 text-white disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}

        <footer className="text-center mt-8 text-gray-500 text-xs">
          Data from CoinGecko API · Built with React + TailwindCSS
        </footer>
      </div>
    </div>
  );
}
