/**
 * EXAMPLE: Using DataTable for Transactions
 * This demonstrates how the same DataTable component can be reused for different entities
 */

import { DataTable } from '../../components/common/DataTable';
import type { DataTableColumn } from '../../types/datatable.types';

// Define your entity type
interface Transaction {
  id: string;
  user_email: string;
  type: 'deposit' | 'withdrawal';
  currency: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
}

export default function TransactionsExample() {
  const transactions: Transaction[] = [
    {
      id: 'tx-001',
      user_email: 'user@example.com',
      type: 'deposit',
      currency: 'BTC',
      amount: 0.05,
      status: 'completed',
      created_at: '2024-01-20T10:30:00Z',
    },
  ];

  // Define columns specific to transactions
  const columns: DataTableColumn<Transaction>[] = [
    {
      headerLabel: 'Transaction ID',
      accessorKey: 'id',
      render: (row) => (
        <span className="font-mono text-sm text-blue-400">{row.id}</span>
      ),
    },
    {
      headerLabel: 'User',
      accessorKey: 'user_email',
      render: (row) => (
        <div>
          <p className="text-white">{row.user_email}</p>
        </div>
      ),
    },
    {
      headerLabel: 'Type',
      accessorKey: 'type',
      render: (row) => (
        <span
          className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
            row.type === 'deposit'
              ? 'bg-green-500/10 text-green-500'
              : 'bg-red-500/10 text-red-500'
          }`}
        >
          {row.type}
        </span>
      ),
    },
    {
      headerLabel: 'Amount',
      accessorKey: 'amount',
      render: (row) => (
        <div className="text-white">
          <span className="font-bold">{row.amount}</span>{' '}
          <span className="text-slate-400">{row.currency}</span>
        </div>
      ),
    },
    {
      headerLabel: 'Status',
      accessorKey: 'status',
      render: (row) => {
        const statusColors = {
          completed: 'bg-green-500/10 text-green-500',
          pending: 'bg-yellow-500/10 text-yellow-500',
          failed: 'bg-red-500/10 text-red-500',
        };
        return (
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${statusColors[row.status]}`}
          >
            {row.status}
          </span>
        );
      },
    },
    {
      headerLabel: 'Date',
      accessorKey: 'created_at',
      render: (row) => new Date(row.created_at).toLocaleString(),
    },
  ];

  return (
    <main className="min-h-screen bg-slate-950 p-6">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-6 text-3xl font-bold text-white">Transactions</h1>
        
        {/* Same DataTable component, different configuration */}
        <DataTable
          columns={columns}
          data={transactions}
          onSearchChange={(value) => console.log('Search:', value)}
          searchPlaceholder="Search transactions..."
          emptyStateMessage="No transactions found"
        />
      </div>
    </main>
  );
}
