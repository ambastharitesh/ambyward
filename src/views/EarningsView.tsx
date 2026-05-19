import { DollarSign, TrendingUp, ArrowDownLeft } from 'lucide-react';

const TRANSACTIONS = [
  { label: 'Coffee Shop Series', amount: '+$32.00', date: 'May 14', positive: true },
  { label: 'Redeemed — Gift Card', amount: '-$25.00', date: 'May 10', positive: false },
  { label: 'Summer Travel Haul', amount: '+$18.50', date: 'May 6', positive: true },
  { label: 'Home Office Setup', amount: '+$9.00', date: 'May 1', positive: true },
];

export default function EarningsView() {
  return (
    <div className="flex flex-col flex-1 overflow-y-auto">
      <header className="bg-primary-main px-5 pt-10 pb-6">
        <p className="text-primary-light text-xs font-medium uppercase tracking-widest mb-0.5">
          Your income
        </p>
        <h1 className="text-white text-2xl font-bold">Earnings</h1>
      </header>

      {/* Summary card */}
      <div className="px-4 -mt-1">
        <div className="bg-white rounded-2xl shadow-md p-5 border border-gray-100">
          <p className="text-text-secondary text-sm mb-1">Total Earnings</p>
          <div className="flex items-end gap-2">
            <span className="text-primary-main text-4xl font-bold">$248.30</span>
          </div>
          <div className="mt-3 flex gap-2">
            <span className="bg-primary-light text-primary-dark text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              +18% this month
            </span>
          </div>
        </div>
      </div>

      {/* Transaction list */}
      <div className="px-4 mt-5">
        <h2 className="text-text-primary font-semibold text-base mb-3">Recent Transactions</h2>
        <div className="flex flex-col gap-3">
          {TRANSACTIONS.map((tx) => (
            <div
              key={tx.label + tx.date}
              className="bg-white rounded-xl px-4 py-3.5 border border-gray-100 shadow-sm flex items-center gap-4"
            >
              <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${tx.positive ? 'bg-primary-light' : 'bg-gray-100'}`}>
                {tx.positive
                  ? <DollarSign className="w-4 h-4 text-primary-main" />
                  : <ArrowDownLeft className="w-4 h-4 text-text-secondary" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-text-primary font-medium text-sm truncate">{tx.label}</p>
                <p className="text-text-secondary text-xs">{tx.date}</p>
              </div>
              <span className={`font-semibold text-sm ${tx.positive ? 'text-success' : 'text-text-secondary'}`}>
                {tx.amount}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="pb-4" />
    </div>
  );
}
