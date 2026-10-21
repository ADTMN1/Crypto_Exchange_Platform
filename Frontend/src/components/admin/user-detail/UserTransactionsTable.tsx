import { AdminUserTransaction } from '../../../services/admin.service'

interface Props {
  transactions: AdminUserTransaction[]
  total: number
  loading: boolean
}

function fmt(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

function fmtNum(n: string | number) {
  return parseFloat(String(n)).toLocaleString('en-US', { maximumFractionDigits: 8 })
}

const TX_STATUS_CLASS: Record<string, string> = {
  completed: 'mu-badge mu-badge--active',
  pending:   'mu-badge mu-badge--pending',
  failed:    'mu-badge mu-badge--banned',
  cancelled: 'mu-badge mu-badge--suspended',
}

const TX_TYPE_CLASS: Record<string, string> = {
  deposit:    'mu-badge mu-badge--active',
  withdrawal: 'mu-badge mu-badge--pending',
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
        <>
          {/* ── Desktop table ── */}
          <div className="mu-table-wrap udp-tx-table">
            <table className="mu-table">
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
                {transactions.map(tx => {
                  const isCredit = tx.type === 'deposit'
                  return (
                    <tr key={tx.id}>
                      <td>
                        <span className={TX_TYPE_CLASS[tx.type] ?? 'mu-badge mu-badge--pending'}>
                          {tx.type}
                        </span>
                      </td>
                      <td><strong>{tx.currency}</strong></td>
                      <td>
                        <span className={isCredit ? 'udp-tx-credit' : 'udp-tx-debit'}>
                          {isCredit ? '+' : '-'}{fmtNum(tx.amount)}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-muted)' }}>
                        {tx.fee ? fmtNum(tx.fee) : '—'}
                      </td>
                      <td>
                        <span className={TX_STATUS_CLASS[tx.status] ?? 'mu-badge mu-badge--pending'}>
                          {tx.status}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: 13, whiteSpace: 'nowrap' }}>
                        {fmt(tx.created_at)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* ── Mobile cards ── */}
          <div className="udp-tx-cards">
            {transactions.map(tx => {
              const isCredit = tx.type === 'deposit'
              return (
                <div key={tx.id} className="udp-tx-card">
                  <div className="udp-tx-card-top">
                    <div className="udp-tx-card-left">
                      <span className={TX_TYPE_CLASS[tx.type] ?? 'mu-badge mu-badge--pending'}>
                        {tx.type}
                      </span>
                      <span className="udp-tx-currency">{tx.currency}</span>
                    </div>
                    <span className={isCredit ? 'udp-tx-credit udp-tx-amount' : 'udp-tx-debit udp-tx-amount'}>
                      {isCredit ? '+' : '-'}{fmtNum(tx.amount)}
                    </span>
                  </div>
                  <div className="udp-tx-card-bottom">
                    <span className={TX_STATUS_CLASS[tx.status] ?? 'mu-badge mu-badge--pending'}>
                      {tx.status}
                    </span>
                    <span className="udp-tx-date">{fmt(tx.created_at)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </section>
  )
}
