import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import '../theme.css';
import { getBrandVars } from './brandTheme';
import AlertModal from './AlertModal';

const FASTAPI_URL = 'http://127.0.0.1:8001';

function Settlement({ token, tenantInfo }) {
  const { groupId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [alertModal, setAlertModal] = useState({ isOpen: false, title: '', message: '', type: 'info' });

  useEffect(() => {
    const fetchSettlement = async () => {
      try {
        const res = await axios.get(`${FASTAPI_URL}/settle/${groupId}`, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000
        });
        setData(res.data);
      } catch (err) {
        if (err.response) {
          if (err.response.status === 503 || err.response.status === 504) {
            setError('Settlement service is currently unavailable. Please try again later.');
          } else {
            setError(err.response.data?.detail || 'Failed to compute settlement.');
          }
        } else if (err.request) {
          setError('Settlement service is unreachable. Please check your connection.');
        } else {
          setError('An unexpected error occurred.');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchSettlement();
  }, [groupId, token]);

  const brandVars = getBrandVars(tenantInfo?.primary_color);

  if (loading) return <div className="lg-page" style={brandVars}><p className="lg-loading">Calculating...</p></div>;
  if (error) return <div className="lg-page" style={brandVars}><p className="lg-error-standalone lg-alert lg-alert--error" style={{ display: 'inline-flex' }}>{error}</p></div>;
  if (!data) return <div className="lg-page" style={brandVars}><p className="lg-loading">No data available.</p></div>;

  const { expenses, balances, transactions } = data;
  const activeExpenses = expenses.filter(exp => !exp.is_deleted);

  const totalCents = activeExpenses.reduce((sum, exp) => sum + Math.round(exp.amount * 100), 0);
  const memberCount = Object.keys(balances).length;
  const exactShareCents = memberCount > 0 ? totalCents / memberCount : 0;
  const baseShareCents = memberCount > 0 ? Math.floor(totalCents / memberCount) : 0;
  const remainderCents = memberCount > 0 ? totalCents - baseShareCents * memberCount : 0;

  const totalFormatted = (totalCents / 100).toFixed(2);
  const shareFormatted = (exactShareCents / 100).toFixed(2);

  const summaryLines = [
    `Total group expense: ₹${totalFormatted}`,
    `Each person’s equal share: ₹${shareFormatted}`,
  ];
  if (remainderCents > 0) {
    summaryLines.push(
      `Rounded to the nearest paise: the first ${remainderCents} member${remainderCents > 1 ? 's' : ''} (alphabetically) ${remainderCents > 1 ? 'each pay' : 'pays'} ₹0.01 extra so the total matches ₹${totalFormatted}.`
    );
  } else {
    summaryLines.push('Exact split – no rounding needed.');
  }

  return (
    <div className="lg-page" style={brandVars}>
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
      />
      <div className="lg-shell">
        <div className="lg-brandbar" />
        <div className="lg-card lg-card--ticket">
          <Link to={`/t/${tenantInfo.tenant_id}/groups/${groupId}`} className="lg-card-back lg-card-back--icon-only" title="Back to group" aria-label="Back to group" />

          <h2 className="lg-title">Settlement breakdown</h2>

          <h3 className="lg-section-title">Expenses</h3>
          {activeExpenses.length === 0 ? (
            <div className="lg-empty">No active expenses recorded.</div>
          ) : (
            <div className="lg-table-wrap">
              <div className="lg-table-scroll">
                <table className="lg-table">
                  <thead><tr><th>Description</th><th>Paid by</th><th className="lg-col-right">Amount</th><th>Date Time</th></tr></thead>
                  <tbody>
                    {activeExpenses.map(exp => (
                      <tr key={exp.id}>
                        <td>{exp.description}</td>
                        <td className="lg-td-nowrap">{exp.paid_by}</td>
                        <td className="lg-money">₹{exp.amount.toFixed(2)}</td>
                        <td className="lg-td-nowrap">{new Date(exp.created_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <h3 className="lg-section-title">Net balances</h3>
          {Object.keys(balances).length === 0 ? (
            <div className="lg-empty">No balances to show.</div>
          ) : (
            <ul className="lg-list">
              {Object.entries(balances).map(([user, bal]) => (
                <li key={user} className="lg-list-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong>{user}</strong>
                  {bal > 0 ? (
                    <span className="lg-money lg-money--pos">gets ₹{bal.toFixed(2)}</span>
                  ) : bal < 0 ? (
                    <span className="lg-money lg-money--neg">owes ₹{Math.abs(bal).toFixed(2)}</span>
                  ) : (
                    <span className="lg-money">settled</span>
                  )}
                </li>
              ))}
            </ul>
          )}

          <h3 className="lg-section-title">Settlement payments</h3>
          {transactions.length === 0 ? (
            <div className="lg-empty">All settled up!</div>
          ) : (
            <ul className="lg-list">
              {transactions.map((t, i) => (
                <li key={i} className="lg-list-item lg-transaction-item">
                  <span>
                    <strong>{t.from_user}</strong> pays <strong>{t.to_user}</strong>
                  </span>
                  <span
                    className="lg-money"
                    style={{ fontWeight: 600, color: 'var(--brand)' }}
                  >
                    ₹{t.amount.toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <div className="lg-summary-box">
            <p>How it’s calculated</p>
            {summaryLines.map((line, idx) => (
              <p key={idx}>{line}</p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settlement;