import { AdminUserTransaction } from '../../../services/admin.service'

interface Props {
  transactions: AdminUserTransaction[]
  total: number
  loading: boolean
}

function fmt(date: string) {
  return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function fmtNum(n: string | number) {
  return parseFloat(String(n)).toLocaleString('en-US', { maximumFractionDigits: 8 })
}

export default function UserTransactionsTable({ transactions, total, loading }: Props) {
  return (
    <section className="nex-card">
      <div className="nex-card-title">
        <h2>Transactions</h2>
        <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{total} total</span>
      </div>

      {loading ? (
        <div className="nex-loading">
          <div className="nex-spinner" />
          <p>Loading transactions…</p>
        </div>
      ) : transactions.length === 0 ? (
        <div className="nex-empty-state"><p>No transactions found</p></div>
      ) : (
        <div className="nex-table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Currency</th>
                <th>Amount</th>
                <th>Fee</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => {
                const isCredit = tx.type === 'deposit'
                return (
                  <tr key={tx.id}>
                    <td>
                      <span className={`nex-badge ${isCredit ? 'nex-badge-success' : 'nex-badge-warning'}`}>
                        {tx.type}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{tx.currency}</td>
                    <td style={{ color: isCredit ? 'var(--success)' : 'var(--danger)', fontWeight: 700 }}>
                      {isCredit ? '+' : '-'}{fmtNum(tx.amount)}
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>
                      {tx.fee ? fmtNum(tx.fee) : '—'}
                    </td>
                    <td>
                      <span className={`nex-badge ${tx.status === 'completed' ? 'nex-badge-success' : 'nex-badge-warning'}`}>
                        {tx.status}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{fmt(tx.created_at)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
