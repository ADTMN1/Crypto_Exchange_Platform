/**
 * DataTable Showcase - Demonstrates all component capabilities
 * This is a reference implementation showing various use cases
 */

import { useState } from 'react';
import { DataTable } from '../../components/common/DataTable';
import type { DataTableColumn } from '../../types/datatable.types';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Star,
  AlertCircle,
} from 'lucide-react';

// Example 1: E-commerce Products
interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  rating: number;
  trending: boolean;
}

// Example 2: Financial Transactions
interface Transaction {
  id: string;
  from: string;
  to: string;
  amount: number;
  currency: string;
  type: 'credit' | 'debit';
  status: 'pending' | 'completed' | 'failed';
  date: string;
}

export default function DataTableShowcase() {
  const [activeTab, setActiveTab] = useState<'products' | 'transactions'>('products');

  // Mock Products Data
  const products: Product[] = [
    {
      id: 'prod-001',
      name: 'Premium Wireless Headphones',
      category: 'Electronics',
      price: 299.99,
      stock: 45,
      rating: 4.8,
      trending: true,
    },
    {
      id: 'prod-002',
      name: 'Ergonomic Office Chair',
      category: 'Furniture',
      price: 449.99,
      stock: 12,
      rating: 4.5,
      trending: false,
    },
    {
      id: 'prod-003',
      name: 'Smart Watch Pro',
      category: 'Electronics',
      price: 399.99,
      stock: 0,
      rating: 4.9,
      trending: true,
    },
  ];

  // Mock Transactions Data
  const transactions: Transaction[] = [
    {
      id: 'tx-001',
      from: 'John Doe',
      to: 'Acme Corp',
      amount: 1250.0,
      currency: 'USD',
      type: 'debit',
      status: 'completed',
      date: '2024-01-20T10:30:00Z',
    },
    {
      id: 'tx-002',
      from: 'Salary Deposit',
      to: 'John Doe',
      amount: 5000.0,
      currency: 'USD',
      type: 'credit',
      status: 'completed',
      date: '2024-01-15T09:00:00Z',
    },
    {
      id: 'tx-003',
      from: 'John Doe',
      to: 'Utility Co',
      amount: 150.0,
      currency: 'USD',
      type: 'debit',
      status: 'pending',
      date: '2024-01-21T14:22:00Z',
    },
  ];

  // Product Columns - Demonstrates complex rendering
  const productColumns: DataTableColumn<Product>[] = [
    {
      headerLabel: 'Product',
      accessorKey: 'name',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
            <Package className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium text-white">{row.name}</p>
              {row.trending && (
                <span className="flex items-center gap-1 rounded-full bg-orange-500/10 px-2 py-0.5 text-xs font-medium text-orange-500">
                  <TrendingUp className="h-3 w-3" />
                  Trending
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">{row.category}</p>
          </div>
        </div>
      ),
    },
    {
      headerLabel: 'Price',
      accessorKey: 'price',
      render: (row) => (
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-green-500" />
          <span className="text-lg font-bold text-white">
            {row.price.toFixed(2)}
          </span>
        </div>
      ),
    },
    {
      headerLabel: 'Stock',
      accessorKey: 'stock',
      render: (row) => (
        <div className="flex items-center gap-2">
          {row.stock > 0 ? (
            <>
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
              <span className="text-sm text-green-500">{row.stock} units</span>
            </>
          ) : (
            <>
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium text-red-500">Out of Stock</span>
            </>
          )}
        </div>
      ),
    },
    {
      headerLabel: 'Rating',
      accessorKey: 'rating',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
          <span className="font-medium text-white">{row.rating}</span>
          <span className="text-xs text-slate-400">/5.0</span>
        </div>
      ),
    },
    {
      headerLabel: 'Actions',
      accessorKey: 'id',
      headerClassName: 'text-right',
      className: 'text-right',
      render: (row) => (
        <div className="flex justify-end gap-2">
          <button className="rounded-lg bg-blue-500/10 px-3 py-1.5 text-sm font-medium text-blue-400 transition-colors hover:bg-blue-500/20">
            Edit
          </button>
          <button className="rounded-lg bg-red-500/10 px-3 py-1.5 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/20">
            Delete
          </button>
        </div>
      ),
    },
  ];

  // Transaction Columns - Demonstrates data type variety
  const transactionColumns: DataTableColumn<Transaction>[] = [
    {
      headerLabel: 'Transaction ID',
      accessorKey: 'id',
      render: (row) => (
        <span className="font-mono text-sm text-blue-400">{row.id}</span>
      ),
    },
    {
      headerLabel: 'Flow',
      accessorKey: 'from',
      render: (row) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-400">From:</span>
            <span className="font-medium text-white">{row.from}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-400">To:</span>
            <span className="font-medium text-white">{row.to}</span>
          </div>
        </div>
      ),
    },
    {
      headerLabel: 'Amount',
      accessorKey: 'amount',
      render: (row) => (
        <div className="flex items-center gap-2">
          {row.type === 'credit' ? (
            <TrendingUp className="h-4 w-4 text-green-500" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-500" />
          )}
          <span
            className={`text-lg font-bold ${
              row.type === 'credit' ? 'text-green-500' : 'text-red-500'
            }`}
          >
            {row.type === 'credit' ? '+' : '-'}${row.amount.toFixed(2)}
          </span>
          <span className="text-xs text-slate-400">{row.currency}</span>
        </div>
      ),
    },
    {
      headerLabel: 'Status',
      accessorKey: 'status',
      render: (row) => {
        const statusConfig = {
          completed: { color: 'bg-green-500/10 text-green-500 border-green-500/20', label: 'Completed' },
          pending: { color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20', label: 'Pending' },
          failed: { color: 'bg-red-500/10 text-red-500 border-red-500/20', label: 'Failed' },
        };
        const config = statusConfig[row.status];
        return (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${config.color}`}
          >
            <div className="h-1.5 w-1.5 rounded-full bg-current"></div>
            {config.label}
          </span>
        );
      },
    },
    {
      headerLabel: 'Date',
      accessorKey: 'date',
      render: (row) => (
        <div className="text-sm text-slate-300">
          {new Date(row.date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </div>
      ),
    },
  ];

  return (
    <main className="min-h-screen bg-slate-950 p-6">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white">DataTable Showcase</h1>
          <p className="mt-2 text-slate-400">
            Production-ready examples demonstrating all DataTable capabilities
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex gap-2 rounded-xl bg-slate-900 p-1">
          <button
            onClick={() => setActiveTab('products')}
            className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === 'products'
                ? 'bg-blue-500 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Products Example
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === 'transactions'
                ? 'bg-blue-500 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Transactions Example
          </button>
        </div>

        {/* Products Table */}
        {activeTab === 'products' && (
          <div className="space-y-4">
            <div className="rounded-xl bg-slate-900 p-4">
              <h3 className="mb-2 font-semibold text-white">Features Demonstrated:</h3>
              <ul className="space-y-1 text-sm text-slate-400">
                <li>• Complex multi-line cell rendering</li>
                <li>• Conditional styling and badges</li>
                <li>• Icon integration (lucide-react)</li>
                <li>• Custom color schemes per cell</li>
                <li>• Action buttons with proper alignment</li>
              </ul>
            </div>
            <DataTable
              columns={productColumns}
              data={products}
              onSearchChange={(val) => console.log('Product search:', val)}
              searchPlaceholder="Search products by name or category..."
              emptyStateMessage="No products found in inventory"
            />
          </div>
        )}

        {/* Transactions Table */}
        {activeTab === 'transactions' && (
          <div className="space-y-4">
            <div className="rounded-xl bg-slate-900 p-4">
              <h3 className="mb-2 font-semibold text-white">Features Demonstrated:</h3>
              <ul className="space-y-1 text-sm text-slate-400">
                <li>• Financial data formatting</li>
                <li>• Positive/negative value styling</li>
                <li>• Status indicators with dot badges</li>
                <li>• Date formatting utilities</li>
                <li>• Monospace IDs for better readability</li>
              </ul>
            </div>
            <DataTable
              columns={transactionColumns}
              data={transactions}
              onSearchChange={(val) => console.log('Transaction search:', val)}
              searchPlaceholder="Search by ID, sender, or recipient..."
              emptyStateMessage="No transactions found"
            />
          </div>
        )}

        {/* Code Reference */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <h3 className="mb-4 text-lg font-semibold text-white">
            📚 Documentation & Resources
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2 text-slate-300">
              <span className="font-medium text-blue-400">Component:</span>
              <code className="rounded bg-slate-800 px-2 py-1 font-mono text-xs">
                src/components/common/DataTable.tsx
              </code>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <span className="font-medium text-blue-400">Types:</span>
              <code className="rounded bg-slate-800 px-2 py-1 font-mono text-xs">
                src/types/datatable.types.ts
              </code>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <span className="font-medium text-blue-400">Documentation:</span>
              <code className="rounded bg-slate-800 px-2 py-1 font-mono text-xs">
                DATATABLE_DOCS.md
              </code>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <span className="font-medium text-blue-400">Migration Guide:</span>
              <code className="rounded bg-slate-800 px-2 py-1 font-mono text-xs">
                DATATABLE_MIGRATION.md
              </code>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
