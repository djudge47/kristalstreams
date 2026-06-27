import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Pencil, Trash2, Search, X, Save } from 'lucide-react';

interface CRMPageProps {
  title: string;
  table: string;
  fields: { key: string; label: string; type?: string; required?: boolean }[];
  icon: React.ReactNode;
}

const CRMPage: React.FC<CRMPageProps> = ({ title, table, fields, icon }) => {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => { fetchRecords(); }, []);

  const fetchRecords = async () => {
    try {
      const { data } = await supabase.from(table).select('*').order('created_at', { ascending: false });
      setRecords(data || []);
    } catch { setRecords([]); }
    setLoading(false);
  };

  const handleSubmit = async () => {
    setError(null);
    try {
      const payload: any = {};
      fields.forEach(f => { if (form[f.key] !== undefined) payload[f.key] = form[f.key]; });
      if (editing?.id) {
        const { error: e } = await supabase.from(table).update(payload).eq('id', editing.id);
        if (e) throw e;
        setSuccess('Updated successfully');
      } else {
        const { error: e } = await supabase.from(table).insert(payload);
        if (e) throw e;
        setSuccess('Created successfully');
      }
      setShowForm(false); setEditing(null); setForm({});
      fetchRecords();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) { setError(err.message); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(`Delete this ${title.toLowerCase().slice(0, -1)}?`)) return;
    await supabase.from(table).delete().eq('id', id);
    fetchRecords();
  };

  const filtered = records.filter(r => JSON.stringify(r).toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        <button onClick={() => { setEditing(null); setForm({}); setShowForm(true); }}
          className="flex items-center bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg">
          <Plus size={18} className="mr-2" />Add New
        </button>
      </div>

      {error && <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg mb-4">{error}</div>}
      {success && <div className="bg-green-900/50 border border-green-700 text-green-300 px-4 py-3 rounded-lg mb-4">{success}</div>}

      {showForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-lg border border-gray-700">
            <div className="flex justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">{editing ? 'Edit' : 'New'} {title.slice(0, -1)}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-white"><X size={24} /></button>
            </div>
            <div className="space-y-4">
              {fields.map(f => (
                <div key={f.key}>
                  <label className="block text-sm text-gray-400 mb-1">{f.label}{f.required && ' *'}</label>
                  {f.type === 'textarea' ? (
                    <textarea value={form[f.key] || ''} onChange={e => setForm({...form, [f.key]: e.target.value})}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white h-24" />
                  ) : f.type === 'select' ? (
                    <select value={form[f.key] || ''} onChange={e => setForm({...form, [f.key]: e.target.value})}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white">
                      <option value="">Select...</option>
                      <option value="new">New</option><option value="contacted">Contacted</option>
                      <option value="qualified">Qualified</option><option value="proposal">Proposal</option>
                      <option value="won">Won</option><option value="lost">Lost</option>
                    </select>
                  ) : (
                    <input type={f.type || 'text'} value={form[f.key] || ''} onChange={e => setForm({...form, [f.key]: e.target.value})}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white" />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-400">Cancel</button>
              <button onClick={handleSubmit} className="flex items-center bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg">
                <Save size={18} className="mr-2" />Save
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="relative mb-6">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder={`Search ${title.toLowerCase()}...`}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white" />
      </div>

      {loading ? (
        <div className="text-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-gray-800 rounded-xl border border-gray-700">
          {icon}
          <p className="text-gray-400 mt-4">No {title.toLowerCase()} found</p>
        </div>
      ) : (
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead><tr className="border-b border-gray-700">
              {fields.slice(0, 4).map(f => <th key={f.key} className="text-left text-gray-400 text-sm px-4 py-3">{f.label}</th>)}
              <th className="text-right text-gray-400 text-sm px-4 py-3">Actions</th>
            </tr></thead>
            <tbody>{filtered.map((r, i) => (
              <tr key={r.id || i} className="border-b border-gray-700/50">
                {fields.slice(0, 4).map(f => <td key={f.key} className="px-4 py-3 text-gray-300 text-sm">{r[f.key] || '—'}</td>)}
                <td className="px-4 py-3 text-right">
                  <button onClick={() => { setEditing(r); setForm(r); setShowForm(true); }} className="text-gray-400 hover:text-blue-400 p-1"><Pencil size={16} /></button>
                  <button onClick={() => handleDelete(r.id)} className="text-gray-400 hover:text-red-400 p-1 ml-2"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
};
export default CRMPage;
