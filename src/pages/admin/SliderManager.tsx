import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Pencil, Trash2, Image, X, Save } from 'lucide-react';

const SliderManager: React.FC = () => {
  const [slides, setSlides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ title: '', subtitle: '', image_url: '', link: '', order_num: 0, is_active: true });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { fetchSlides(); }, []);

  const fetchSlides = async () => {
    try { const { data } = await supabase.from('slides').select('*').order('order_num'); setSlides(data || []); }
    catch { setSlides([]); }
    setLoading(false);
  };

  const handleSubmit = async () => {
    try {
      if (editing?.id) { await supabase.from('slides').update(form).eq('id', editing.id); }
      else { await supabase.from('slides').insert(form); }
      setShowForm(false); setEditing(null); setForm({ title: '', subtitle: '', image_url: '', link: '', order_num: 0, is_active: true });
      fetchSlides();
    } catch (err: any) { setError(err.message); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this slide?')) return;
    await supabase.from('slides').delete().eq('id', id);
    fetchSlides();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Slider Manager</h1>
        <button onClick={() => { setEditing(null); setForm({ title: '', subtitle: '', image_url: '', link: '', order_num: 0, is_active: true }); setShowForm(true); }}
          className="flex items-center bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"><Plus size={18} className="mr-2" />Add Slide</button>
      </div>
      {error && <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg mb-4">{error}</div>}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-lg border border-gray-700">
            <div className="flex justify-between mb-4"><h2 className="text-xl font-semibold text-white">{editing ? 'Edit' : 'Add'} Slide</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-white"><X size={24} /></button></div>
            <div className="space-y-4">
              <input type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Title" className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white" />
              <input type="text" value={form.subtitle} onChange={e => setForm({...form, subtitle: e.target.value})} placeholder="Subtitle" className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white" />
              <input type="text" value={form.image_url} onChange={e => setForm({...form, image_url: e.target.value})} placeholder="Image URL" className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white" />
              <input type="text" value={form.link} onChange={e => setForm({...form, link: e.target.value})} placeholder="Link URL" className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white" />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-400">Cancel</button>
              <button onClick={handleSubmit} className="flex items-center bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg"><Save size={18} className="mr-2" />Save</button>
            </div>
          </div>
        </div>
      )}
      {loading ? <div className="text-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div></div>
      : slides.length === 0 ? <div className="text-center py-12 bg-gray-800 rounded-xl border border-gray-700"><Image size={48} className="mx-auto text-gray-600 mb-4" /><p className="text-gray-400">No slides yet</p></div>
      : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {slides.map(s => (
            <div key={s.id} className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
              {s.image_url && <img src={s.image_url} alt={s.title} className="w-full h-40 object-cover" />}
              <div className="p-4">
                <h3 className="text-white font-medium">{s.title}</h3>
                <p className="text-gray-400 text-sm">{s.subtitle}</p>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => { setEditing(s); setForm(s); setShowForm(true); }} className="text-gray-400 hover:text-blue-400"><Pencil size={16} /></button>
                  <button onClick={() => handleDelete(s.id)} className="text-gray-400 hover:text-red-400"><Trash2 size={16} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      }
    </div>
  );
};
export default SliderManager;
