import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Pencil, Trash2, Search, X, Save, Tv, Upload, Download } from 'lucide-react';

interface Channel {
  id?: string;
  name: string;
  category: string;
  stream_url: string;
  logo_url?: string;
  is_active?: boolean;
  order_num?: number;
  [key: string]: any;
}

const csvEscape = (value: unknown) => {
  const text = value === null || value === undefined ? '' : String(value);
  return `"${text.replace(/"/g, '""')}"`;
};

const parseCsvLine = (line: string) => {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      i += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  values.push(current.trim());
  return values.map((value) => value.replace(/^"|"$/g, ''));
};

const ChannelManager: React.FC = () => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState('all');

  const [form, setForm] = useState<Channel>({
    name: '',
    category: '',
    stream_url: '',
    logo_url: '',
    is_active: true,
    order_num: 0,
  });

  useEffect(() => {
    fetchChannels();
  }, []);

  const fetchChannels = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('channels')
        .select('*')
        .order('name', { ascending: true });

      if (fetchError) throw fetchError;
      setChannels(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch channels');
      setChannels([]);
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.stream_url) {
      setError('Name and Stream URL are required');
      return;
    }

    setError(null);
    try {
      if (editingChannel?.id) {
        const { error: updateError } = await supabase
          .from('channels')
          .update({
            name: form.name,
            category: form.category,
            stream_url: form.stream_url,
            logo_url: form.logo_url,
            is_active: form.is_active,
            order_num: form.order_num,
          })
          .eq('id', editingChannel.id);

        if (updateError) throw updateError;
        setSuccess('Channel updated successfully');
      } else {
        const { error: insertError } = await supabase
          .from('channels')
          .insert({
            name: form.name,
            category: form.category,
            stream_url: form.stream_url,
            logo_url: form.logo_url,
            is_active: form.is_active,
            order_num: form.order_num,
          });

        if (insertError) throw insertError;
        setSuccess('Channel added successfully');
      }

      setShowForm(false);
      setEditingChannel(null);
      setForm({ name: '', category: '', stream_url: '', logo_url: '', is_active: true, order_num: 0 });
      fetchChannels();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save channel');
    }
  };

  const handleEdit = (channel: Channel) => {
    setEditingChannel(channel);
    setForm({
      name: channel.name || '',
      category: channel.category || '',
      stream_url: channel.stream_url || '',
      logo_url: channel.logo_url || '',
      is_active: channel.is_active !== false,
      order_num: channel.order_num || 0,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this channel?')) return;
    try {
      const { error: deleteError } = await supabase.from('channels').delete().eq('id', id);
      if (deleteError) throw deleteError;
      setSuccess('Channel deleted');
      fetchChannels();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to delete channel');
    }
  };

  const handleNewChannel = () => {
    setEditingChannel(null);
    setForm({ name: '', category: '', stream_url: '', logo_url: '', is_active: true, order_num: 0 });
    setShowForm(true);
  };

  const handleExportCSV = () => {
    if (channels.length === 0) {
      setError('No channels available to export');
      return;
    }

    const header = ['name', 'stream_url', 'category', 'logo_url', 'is_active', 'order_num'];
    const rows = channels.map((channel) => [
      channel.name,
      channel.stream_url,
      channel.category || 'General',
      channel.logo_url || '',
      channel.is_active !== false ? 'true' : 'false',
      channel.order_num || 0,
    ]);

    const csv = [header, ...rows]
      .map((row) => row.map(csvEscape).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const date = new Date().toISOString().slice(0, 10);

    link.href = url;
    link.download = `kristalstream-channels-${date}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setSuccess(`Exported ${channels.length} channels to CSV`);
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleBulkImport = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.m3u,.m3u8,.csv';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;

      const text = await file.text();
      const lines = text.split('\n');
      const newChannels: Channel[] = [];

      if (file.name.endsWith('.csv')) {
        lines.forEach((line: string, i: number) => {
          if (i === 0 || !line.trim()) return;
          const parts = parseCsvLine(line);
          if (parts.length >= 2 && parts[0] && parts[1]) {
            newChannels.push({
              name: parts[0],
              stream_url: parts[1],
              category: parts[2] || 'General',
              logo_url: parts[3] || '',
              is_active: parts[4] ? parts[4].toLowerCase() !== 'false' : true,
              order_num: parts[5] ? parseInt(parts[5], 10) || 0 : 0,
            });
          }
        });
      } else {
        let currentName = '';
        let currentLogo = '';
        let currentGroup = '';
        lines.forEach((line: string) => {
          line = line.trim();
          if (line.startsWith('#EXTINF:')) {
            const nameMatch = line.match(/,(.+)$/);
            const logoMatch = line.match(/tvg-logo="([^"]+)"/);
            const groupMatch = line.match(/group-title="([^"]+)"/);
            currentName = nameMatch ? nameMatch[1].trim() : '';
            currentLogo = logoMatch ? logoMatch[1] : '';
            currentGroup = groupMatch ? groupMatch[1] : 'General';
          } else if (line && !line.startsWith('#')) {
            if (currentName) {
              newChannels.push({
                name: currentName,
                stream_url: line,
                category: currentGroup,
                logo_url: currentLogo,
                is_active: true,
              });
            }
            currentName = '';
          }
        });
      }

      if (newChannels.length === 0) {
        setError('No channels found in the file');
        return;
      }

      try {
        const batchSize = 50;
        for (let i = 0; i < newChannels.length; i += batchSize) {
          const batch = newChannels.slice(i, i + batchSize);
          const { error: insertError } = await supabase.from('channels').insert(batch);
          if (insertError) throw insertError;
        }
        setSuccess(`Imported ${newChannels.length} channels successfully`);
        fetchChannels();
        setTimeout(() => setSuccess(null), 3000);
      } catch (err: any) {
        setError(err.message || 'Failed to import channels');
      }
    };
    input.click();
  };

  const categories = ['all', ...new Set(channels.map((c) => c.category).filter(Boolean))];

  const filteredChannels = channels.filter((c) => {
    const matchesSearch =
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.category?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || c.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Channel Manager</h1>
          <p className="text-gray-400 text-sm mt-1">{channels.length} total channels</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExportCSV}
            disabled={channels.length === 0}
            className="flex items-center bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Download size={18} className="mr-2" />
            Export CSV
          </button>
          <button
            onClick={handleBulkImport}
            className="flex items-center bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Upload size={18} className="mr-2" />
            Import M3U/CSV
          </button>
          <button
            onClick={handleNewChannel}
            className="flex items-center bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={18} className="mr-2" />
            Add Channel
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg mb-4">
          {error}
          <button onClick={() => setError(null)} className="float-right"><X size={18} /></button>
        </div>
      )}

      {success && (
        <div className="bg-green-900/50 border border-green-700 text-green-300 px-4 py-3 rounded-lg mb-4">
          {success}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-lg border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">
                {editingChannel ? 'Edit Channel' : 'Add Channel'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Channel Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                  placeholder="e.g. ESPN HD"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Stream URL *</label>
                <input
                  type="text"
                  value={form.stream_url}
                  onChange={(e) => setForm({ ...form, stream_url: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Category</label>
                <input
                  type="text"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                  placeholder="e.g. Sports, News, Entertainment"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Logo URL</label>
                <input
                  type="text"
                  value={form.logo_url}
                  onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                  placeholder="https://..."
                />
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-gray-300">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                    className="rounded"
                  />
                  Active
                </label>
                <div className="flex-1">
                  <label className="block text-sm text-gray-400 mb-1">Sort Order</label>
                  <input
                    type="number"
                    value={form.order_num}
                    onChange={(e) => setForm({ ...form, order_num: parseInt(e.target.value) || 0 })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="flex items-center bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                <Save size={18} className="mr-2" />
                {editingChannel ? 'Update' : 'Add'} Channel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filter */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search channels..."
            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat === 'all' ? 'All Categories' : cat}
            </option>
          ))}
        </select>
      </div>

      {/* Channel List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="text-gray-400 mt-4">Loading channels...</p>
        </div>
      ) : filteredChannels.length === 0 ? (
        <div className="text-center py-12 bg-gray-800 rounded-xl border border-gray-700">
          <Tv size={48} className="mx-auto text-gray-600 mb-4" />
          <p className="text-gray-400 text-lg">No channels found</p>
          <p className="text-gray-500 text-sm mt-2">Add channels manually or import from an M3U/CSV file</p>
        </div>
      ) : (
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left text-gray-400 text-sm font-medium px-4 py-3">Channel</th>
                <th className="text-left text-gray-400 text-sm font-medium px-4 py-3">Category</th>
                <th className="text-left text-gray-400 text-sm font-medium px-4 py-3">Status</th>
                <th className="text-right text-gray-400 text-sm font-medium px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredChannels.map((channel) => (
                <tr key={channel.id} className="border-b border-gray-700/50 hover:bg-gray-750">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {channel.logo_url ? (
                        <img src={channel.logo_url} alt="" className="w-8 h-8 rounded object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded bg-gray-700 flex items-center justify-center">
                          <Tv size={14} className="text-gray-500" />
                        </div>
                      )}
                      <span className="text-white text-sm">{channel.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-gray-400 text-sm">{channel.category || '—'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      channel.is_active !== false
                        ? 'bg-green-900/50 text-green-400'
                        : 'bg-red-900/50 text-red-400'
                    }`}>
                      {channel.is_active !== false ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleEdit(channel)}
                      className="text-gray-400 hover:text-blue-400 p-1 transition-colors"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(channel.id!)}
                      className="text-gray-400 hover:text-red-400 p-1 ml-2 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ChannelManager;
