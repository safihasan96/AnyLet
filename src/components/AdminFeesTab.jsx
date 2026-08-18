import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc, updateDoc, collection, addDoc, serverTimestamp, query, orderBy, getDocs, limit } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Banknote, Save, History, RefreshCw, AlertCircle, Percent, Hash } from 'lucide-react';
import ConfirmationModal from './ConfirmationModal';

const FLAT_MAX = 10000;
const PERCENT_MAX = 100;

export default function AdminFeesTab() {
  const { currentUser } = useAuth();
  const toast = useToast();
  
  const [fees, setFees] = useState({
    listingFee: { type: 'flat', value: 0 },
    onsiteVerificationFee: { type: 'flat', value: 0 },
    standaloneVerificationFee: { type: 'flat', value: 0 },
    subscriptionMonthlyPrice: { type: 'flat', value: 0 },
    depositServiceFee: { type: 'flat', value: 0 },
    commissionRate: { type: 'percentage', value: 2 }, // Represented as % here for easy UX (e.g., 2 for 2%)
    withdrawalLimits: { minAmount: 100, maxAmount: 50000 }
  });
  
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const feesRef = doc(db, 'platformConfig', 'fees');
      const snap = await getDoc(feesRef);
      if (snap.exists()) {
        const data = snap.data();
        // Translate the backend format to UX format where necessary
        const uiData = {
          ...data,
          // If commission is stored as 0.02, show 2 in the UI
          commissionRate: {
            type: data.commissionRate?.type || 'percentage',
            value: (data.commissionRate?.value || 0) * (data.commissionRate?.type === 'percentage' ? 100 : 1)
          }
        };
        setFees(uiData);
      }
      
      const historyRef = collection(db, 'platformConfig', 'fees', 'history');
      const q = query(historyRef, orderBy('changedAt', 'desc'), limit(10));
      const hSnap = await getDocs(q);
      const hData = hSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setHistory(hData);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load fees configuration');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleChange = (field, subfield, value) => {
    setFees(prev => {
      const updated = { ...prev[field], [subfield]: value };
      
      // Auto-enforce max values if they toggle to percentage while value > 100
      if (subfield === 'type' && value === 'percentage' && updated.value > PERCENT_MAX) {
        updated.value = PERCENT_MAX;
      }

      return { ...prev, [field]: updated };
    });
  };

  const handleWithdrawalChange = (subfield, value) => {
    setFees(prev => ({
      ...prev,
      withdrawalLimits: { ...prev.withdrawalLimits, [subfield]: Number(value) }
    }));
  };

  const onSubmit = (e) => {
    e.preventDefault();
    setConfirmModalOpen(true);
  };

  const executeSave = async () => {
    setConfirmModalOpen(false);
    setSaving(true);
    try {
      const feesRef = doc(db, 'platformConfig', 'fees');
      const oldSnap = await getDoc(feesRef);
      const oldConfig = oldSnap.exists() ? oldSnap.data() : null;

      // Translate UX format back to backend format (e.g. 2% -> 0.02)
      const dataToSave = { ...fees };
      if (dataToSave.commissionRate?.type === 'percentage') {
        dataToSave.commissionRate = {
          type: 'percentage',
          value: Number((dataToSave.commissionRate.value / 100).toFixed(4))
        };
      } else {
        dataToSave.commissionRate = {
          type: 'flat',
          value: Number(dataToSave.commissionRate.value)
        };
      }

      // Ensure all other values are cleanly cast to numbers
      for (const [key, obj] of Object.entries(dataToSave)) {
        if (key !== 'withdrawalLimits' && key !== 'commissionRate' && obj && typeof obj === 'object') {
          dataToSave[key].value = Number(obj.value);
        }
      }

      const newConfig = {
        ...dataToSave,
        lastUpdatedBy: currentUser.uid,
        lastUpdatedAt: serverTimestamp(),
        version: (oldConfig?.version || 0) + 1
      };

      await updateDoc(feesRef, newConfig);

      await addDoc(collection(db, 'platformConfig', 'fees', 'history'), {
        previousConfig: oldConfig,
        newConfig,
        changedBy: currentUser.uid,
        changedAt: serverTimestamp(),
        reason: "Admin panel update"
      });

      toast.success('Fees updated successfully');
      fetchConfig();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update fees');
    } finally {
      setSaving(false);
    }
  };

  const renderFeeInput = (label, fieldKey, options = {}) => {
    const feeObj = fees[fieldKey] || { type: 'flat', value: 0 };
    const max = feeObj.type === 'percentage' ? PERCENT_MAX : FLAT_MAX;
    const isPercentage = feeObj.type === 'percentage';
    const disableTypeToggle = options.fixedType;

    return (
      <div className="space-y-3 p-5 rounded-2xl border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]">
        <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block">{label}</label>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold z-10">
              {isPercentage ? '%' : '৳'}
            </span>
            <input 
              type="number" 
              required 
              min="0"
              max={max}
              step={isPercentage ? "0.1" : "1"}
              className="w-full pl-9 pr-4 py-3 bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-white/10 rounded-xl font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
              value={feeObj.value} 
              onChange={e => handleChange(fieldKey, 'value', Number(e.target.value))} 
            />
          </div>

          {!disableTypeToggle && (
            <div className="flex bg-slate-200/50 dark:bg-white/5 rounded-xl p-1 shrink-0">
              <button
                type="button"
                onClick={() => handleChange(fieldKey, 'type', 'flat')}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${!isPercentage ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                <Hash size={14} /> Flat
              </button>
              <button
                type="button"
                onClick={() => handleChange(fieldKey, 'type', 'percentage')}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${isPercentage ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                <Percent size={14} /> Percent
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <RefreshCw className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
            <Banknote className="text-primary" /> Fees & Pricing Configuration
          </h2>
          <p className="text-slate-500 mt-2 font-medium">Manage platform fees. Changes apply immediately to new transactions.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-[#1A1D24] rounded-[24px] border border-slate-100 dark:border-white/[0.05] shadow-sm overflow-hidden p-6 md:p-8">
        <form onSubmit={onSubmit} className="space-y-6">
          
          <div className="grid md:grid-cols-2 gap-6">
            {renderFeeInput('Listing Fee (Free for Premium)', 'listingFee')}
            {renderFeeInput('Onsite Verification Fee (Add-on)', 'onsiteVerificationFee')}
            {renderFeeInput('Standalone Agent Visit Fee', 'standaloneVerificationFee')}
            {renderFeeInput('Premium Subscription (Monthly)', 'subscriptionMonthlyPrice')}
            {renderFeeInput('Escrow Deposit Service Fee', 'depositServiceFee')}
            {renderFeeInput('Referral Commission Rate', 'commissionRate')}

            {/* Withdrawal Limits */}
            <div className="space-y-3 p-5 rounded-2xl border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block">Withdrawal Limits</label>
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold z-10">Min ৳</span>
                  <input type="number" required min="1" className="w-full pl-11 pr-3 py-3 bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-white/10 rounded-xl font-bold focus:ring-2 focus:ring-primary outline-none transition-all text-sm"
                    value={fees.withdrawalLimits?.minAmount || ''} onChange={e => handleWithdrawalChange('minAmount', e.target.value)} />
                </div>
                <div className="flex-1 relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold z-10">Max ৳</span>
                  <input type="number" required min="1" max="1000000" className="w-full pl-11 pr-3 py-3 bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-white/10 rounded-xl font-bold focus:ring-2 focus:ring-primary outline-none transition-all text-sm"
                    value={fees.withdrawalLimits?.maxAmount || ''} onChange={e => handleWithdrawalChange('maxAmount', e.target.value)} />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 dark:border-white/10 flex justify-end">
            <button type="submit" disabled={saving} className="bg-primary hover:bg-indigo-600 text-white px-8 py-3.5 rounded-xl font-black flex items-center gap-2 transition-colors disabled:opacity-50 shadow-lg shadow-primary/20 hover:shadow-primary/30">
              {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Save Configuration
            </button>
          </div>
        </form>
      </div>

      {/* History Log */}
      <div>
        <h3 className="text-xl font-black mb-4 flex items-center gap-2 text-slate-800 dark:text-slate-200">
          <History className="w-5 h-5" /> Change History
        </h3>
        <div className="bg-white dark:bg-[#1A1D24] rounded-[24px] border border-slate-100 dark:border-white/[0.05] p-6 space-y-4">
          {history.length === 0 ? (
            <p className="text-slate-500 font-medium text-center py-4">No changes recorded yet.</p>
          ) : history.map(log => (
            <div key={log.id} className="pb-4 border-b border-slate-100 dark:border-white/5 last:border-0 last:pb-0">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">Updated by {log.changedBy}</p>
                  <p className="text-xs text-slate-500 mt-1">{log.changedAt?.toDate().toLocaleString()}</p>
                </div>
                <span className="text-xs px-2 py-1 bg-slate-100 dark:bg-white/10 rounded text-slate-600 dark:text-slate-300 font-bold">
                  v{log.newConfig?.version}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <ConfirmationModal
        isOpen={confirmModalOpen}
        title="Confirm Fee Changes"
        message="This will affect all new bookings and payments immediately. Are you absolutely sure you want to apply these changes?"
        confirmLabel="Apply Changes"
        variant="warning"
        icon={AlertCircle}
        onConfirm={executeSave}
        onCancel={() => setConfirmModalOpen(false)}
        isLoading={saving}
      />
    </div>
  );
}
