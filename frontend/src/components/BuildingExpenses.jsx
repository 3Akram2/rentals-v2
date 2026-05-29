import { useEffect, useMemo, useState } from 'react';
import { useLang } from '../context/LanguageContext';
import { createExpense, deleteExpense, getExpenses } from '../api';
import NumberInput from './NumberInput';
import DialogCloseButton from './DialogCloseButton';
import { formatNumber } from '../utils/numberToArabicWords';

function BuildingExpenses({ building, onClose, canCreateExpense = false, canDeleteExpense = false }) {
  const { t } = useLang();
  const [year, setYear] = useState(new Date().getFullYear());
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newExpense, setNewExpense] = useState({
    description: '',
    amount: '',
    expenseType: 'proportional',
    ownerGroupId: '',
  });

  useEffect(() => {
    loadExpenses();
  }, [building._id, year]);

  async function loadExpenses() {
    setLoading(true);
    try {
      const data = await getExpenses(building._id, year);
      setExpenses(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddExpense(e) {
    e.preventDefault();
    if (!canCreateExpense || !newExpense.description.trim() || !newExpense.amount) return;

    await createExpense({
      buildingId: building._id,
      year,
      description: newExpense.description.trim(),
      amount: Number(newExpense.amount),
      expenseType: newExpense.expenseType,
      ownerGroupId: newExpense.ownerGroupId || null,
    });

    setNewExpense({
      description: '',
      amount: '',
      expenseType: 'proportional',
      ownerGroupId: '',
    });
    loadExpenses();
  }

  async function handleDeleteExpense(id) {
    if (!canDeleteExpense || !window.confirm(t('deleteExpense'))) return;
    await deleteExpense(id);
    loadExpenses();
  }

  const years = [];
  const now = new Date().getFullYear();
  for (let y = now - 5; y <= now + 1; y++) {
    years.push(y);
  }

  const ownerGroups = building.ownerGroups || [];

  const summary = useMemo(() => {
    return expenses.reduce((totals, expense) => {
      const amount = Number(expense.amount) || 0;
      totals.total += amount;

      if (expense.ownerGroupId) {
        totals.group += amount;
      } else if (expense.expenseType === 'equal') {
        totals.equal += amount;
      } else {
        totals.proportional += amount;
      }

      return totals;
    }, {
      total: 0,
      proportional: 0,
      equal: 0,
      group: 0,
    });
  }, [expenses]);

  function getGroupName(ownerGroupId) {
    if (!ownerGroupId) return t('allOwners');
    return ownerGroups.find(group => group._id === ownerGroupId)?.name || t('group');
  }

  return (
    <div>
      <div className="report-header">
        <h3>{t('expenses')} - {building.number}</h3>
        <div className="report-header-actions">
          <DialogCloseButton onClick={onClose} />
        </div>
      </div>

      <div className="building-expenses-toolbar">
        <div className="form-group">
          <label>{t('selectYear')}</label>
          <select value={year} onChange={e => setYear(Number(e.target.value))}>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      <div className="expense-summary-grid">
        <div className="expense-summary-item total">
          <span>{t('totalExpenses')}</span>
          <strong>{formatNumber(summary.total)}</strong>
        </div>
        <div className="expense-summary-item">
          <span>{t('proportionalExpenses')}</span>
          <strong>{formatNumber(summary.proportional)}</strong>
        </div>
        <div className="expense-summary-item">
          <span>{t('equalExpenses')}</span>
          <strong>{formatNumber(summary.equal)}</strong>
        </div>
        <div className="expense-summary-item">
          <span>{t('groupExpenses')}</span>
          <strong>{formatNumber(summary.group)}</strong>
        </div>
      </div>

      {canCreateExpense && (
        <div className="building-expense-entry">
          <h4>{t('addExpense')}</h4>
          <form onSubmit={handleAddExpense} className="building-expense-form">
            <div className="form-group">
              <label>{t('description')}</label>
              <input
                type="text"
                value={newExpense.description}
                onChange={e => setNewExpense({ ...newExpense, description: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>{t('amount')}</label>
              <NumberInput
                value={newExpense.amount}
                onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>{t('type')}</label>
              <select
                value={newExpense.expenseType}
                onChange={e => setNewExpense({ ...newExpense, expenseType: e.target.value, ownerGroupId: '' })}
              >
                <option value="proportional">{t('proportional')}</option>
                <option value="equal">{t('equal')}</option>
              </select>
            </div>
            <div className="form-group">
              <label>{t('appliesTo')}</label>
              {newExpense.expenseType === 'equal' ? (
                <select
                  value={newExpense.ownerGroupId}
                  onChange={e => setNewExpense({ ...newExpense, ownerGroupId: e.target.value })}
                >
                  <option value="">{t('allOwners')}</option>
                  {ownerGroups.map(group => (
                    <option key={group._id} value={group._id}>{group.name}</option>
                  ))}
                </select>
              ) : (
                <input type="text" value={t('allOwners')} disabled />
              )}
            </div>
            <button type="submit" className="btn btn-primary">{t('addExpense')}</button>
          </form>
        </div>
      )}

      <div className="building-expenses-list">
        <h4>{t('expenses')}</h4>
        {loading ? (
          <p>{t('loading')}</p>
        ) : expenses.length === 0 ? (
          <p className="no-expenses">{t('noExpenses')} {year}</p>
        ) : (
          <div className="table-wrapper">
            <table className="expense-table building-expenses-table">
              <thead>
                <tr>
                  <th>{t('description')}</th>
                  <th>{t('amount')}</th>
                  <th>{t('type')}</th>
                  <th>{t('appliesTo')}</th>
                  {canDeleteExpense && <th></th>}
                </tr>
              </thead>
              <tbody>
                {expenses.map(expense => (
                  <tr key={expense._id}>
                    <td>{expense.description}</td>
                    <td>{formatNumber(expense.amount)}</td>
                    <td>
                      <span className={`expense-type-badge ${expense.expenseType || 'proportional'}`}>
                        {t(expense.expenseType || 'proportional')}
                      </span>
                    </td>
                    <td>{getGroupName(expense.ownerGroupId)}</td>
                    {canDeleteExpense && (
                      <td>
                        <button
                          type="button"
                          className="btn btn-danger btn-small"
                          onClick={() => handleDeleteExpense(expense._id)}
                        >
                          {t('delete')}
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default BuildingExpenses;
