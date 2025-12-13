
import { MOCK_PROJECTS, MOCK_INVOICES, MOCK_TRANSACTIONS, MOCK_SYP_TRANSACTIONS } from '../constants';
import { DashboardStats, Project, Invoice, Transaction } from '../types';

// In a real app, these would be Axios/Fetch calls to the FastAPI backend.
// Here we simulate async delays and data manipulation.

export const getDashboardStats = async (): Promise<DashboardStats> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Calculate from mocks
      const revenue = MOCK_PROJECTS.reduce((acc, curr) => acc + curr.revenue, 0);
      const expenses = MOCK_PROJECTS.reduce((acc, curr) => acc + curr.expenses, 0);
      
      resolve({
        totalRevenue: revenue,
        totalExpenses: expenses,
        netProfit: revenue - expenses,
        activeProjects: MOCK_PROJECTS.filter(p => p.status === 'تنفيذ' || p.status === 'تصميم').length,
        cashFlowStatus: (revenue - expenses) > 0 ? 'Positive' : 'Negative'
      });
    }, 500);
  });
};

export const getProjects = async (): Promise<Project[]> => {
  return new Promise((resolve) => setTimeout(() => resolve(MOCK_PROJECTS), 400));
};

export const getRecentInvoices = async (): Promise<Invoice[]> => {
  return new Promise((resolve) => setTimeout(() => resolve(MOCK_INVOICES), 400));
};

export const getRecentTransactions = async (): Promise<Transaction[]> => {
  return new Promise((resolve) => setTimeout(() => resolve(MOCK_TRANSACTIONS), 400));
};

export const getRecentSYPTransactions = async (): Promise<Transaction[]> => {
  return new Promise((resolve) => setTimeout(() => resolve(MOCK_SYP_TRANSACTIONS), 400));
};

export const formatCurrency = (amount: number, currencyCode: 'USD' | 'SYP' = 'USD') => {
  if (currencyCode === 'SYP') {
    return new Intl.NumberFormat('ar-SY', { 
      style: 'currency', 
      currency: 'SYP',
      maximumFractionDigits: 0 
    }).format(amount).replace('SYP', 'ل.س');
  }

  // Default to USD
  return new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(amount);
};
