import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Upload, AlertCircle, CheckCircle, Tv } from 'lucide-react';

interface ParsedChannel {
  name: string;
  stream_url: string;
  category: string;
  quality: string;
  language: string;
}

const ImportChannels: React.FC = () => {
  const navigate = useNavigate();
  const [m3uContent, setM3uContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [parsedChannels, setParsedChannels] = useState<ParsedChannel[]>([]);

  const parseM3U = (content: string): ParsedChannel[] => {
    const lines = content.split('\n');
    const channels: ParsedChannel[] = [];
    let currentName = '';
    let currentCategory = 'Entertainment';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('#EXTINF:')) {
        const nameMatch = line.match(/,(.+)$/);
        const groupMatch = line.match(/group-title="([^"]+)"/);
        currentName = nameMatch ? nameMatch[1].trim() : 'Unknown Channel';
        currentCategory = groupMatch ? groupMatch[1].trim() : 'Entertainment';
      } else if (line && !line.startsWith('#') && currentName) {
        let quality = 'HD';
        if (currentName.includes('UHD') || currentName.includes('4K')) quality = 'UHD';
        else if (currentName.includes('FHD')) quality = 'FHD';
        else if (currentName.includes('LHD') || currentName.includes('SD')) quality = 'LHD';

        channels.push({
          name: currentName,
          stream_url: line,
          category: currentCategory,
          quality,
          language: 'English',
        });
        currentName = '';
      }
    }
    return channels;
  };

  const handleParse = () => {
    setError(null);
    setSuccess(null);
    if (!m3uContent.trim()) {
      setError('Please paste M3U playlist content');
      return;
    }
    const channels = parseM3U(m3uContent);
    if (channels.length === 0) {
      setError('No valid channels found in the playlist');
      return;
    }
    setParsedChannels(channels);
    setSuccess(`Found ${channels.length} channels ready to import`);
  };

  const handleImport = async () => {
    if (parsedChannels.length === 0) return;
    setLoading(true);
    setError(null);

    try {
      const { data: existing } = await supabase
        .from('channels')
        .select('number')
        .order('number', { ascending: false })
        .limit(1);

      const startNumber = (existing && existing.length > 0) ? existing[0].number + 1 : 1;

      const channelsToInsert = parsedChannels.map((ch, i) => ({
        number: startNumber + i,
        name: ch.name,
        stream_url: ch.stream_url,
        category: ch.category,
        quality: ch.quality,
        language: ch.language,
        is_active: true,
      }));

      const batchSize = 50;
      for (let i = 0; i < channelsToInsert.length; i += batchSize) {
        const batch = channelsToInsert.slice(i, i + batchSize);
        const { error: insertError } = await supabase.from('channels').insert(batch);
        if (insertError) throw insertError;
      }

      setSuccess(`Successfully imported ${parsedChannels.length} channels`);
      setParsedChannels([]);
      setM3uContent('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to import channels');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setM3uContent((event.target?.result as string) || '');
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Import Channels</h1>
          <p className="text-gray-400 mt-1">Import channels from an M3U playlist file</p>
        </div>
        <button
          onClick={() => navigate('/client/account')}
          className="text-gray-400 hover:text-white transition-colors"
        >
          Back to Account
        </button>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-red-300">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-900/30 border border-green-700 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
          <p className="text-green-300">{success}</p>
        </div>
      )}

      <div className="bg-[#1a1a2e] rounded-xl p-6 border border-gray-800">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Upload M3U File
            </label>
            <input
              type="file"
              accept=".m3u,.m3u8,.txt"
              onChange={handleFileUpload}
              className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-red-600 file:text-white file:cursor-pointer hover:file:bg-red-700"
            />
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-[#1a1a2e] px-2 text-gray-500">or paste content</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              M3U Playlist Content
            </label>
            <textarea
              value={m3uContent}
              onChange={(e) => setM3uContent(e.target.value)}
              rows={10}
              placeholder={'#EXTM3U\n#EXTINF:-1 group-title="Entertainment",Channel Name\nhttp://stream-url.m3u8'}
              className="w-full bg-[#0d0d1a] text-white border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-red-500 placeholder-gray-600 font-mono text-sm"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleParse}
              disabled={loading}
              className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-5 py-2.5 rounded-lg transition-colors disabled:opacity-50"
            >
              <Tv className="w-4 h-4" />
              Parse Channels
            </button>
            {parsedChannels.length > 0 && (
              <button
                onClick={handleImport}
                disabled={loading}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-lg transition-colors disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                {loading ? 'Importing...' : `Import ${parsedChannels.length} Channels`}
              </button>
            )}
          </div>
        </div>
      </div>

      {parsedChannels.length > 0 && (
        <div className="bg-[#1a1a2e] rounded-xl border border-gray-800 overflow-hidden">
          <div className="p-4 border-b border-gray-800">
            <h2 className="text-lg font-semibold text-white">Preview ({parsedChannels.length} channels)</h2>
          </div>
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#0d0d1a] sticky top-0">
                <tr>
                  <th className="text-left px-4 py-2 text-gray-400 font-medium">#</th>
                  <th className="text-left px-4 py-2 text-gray-400 font-medium">Name</th>
                  <th className="text-left px-4 py-2 text-gray-400 font-medium">Category</th>
                  <th className="text-left px-4 py-2 text-gray-400 font-medium">Quality</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {parsedChannels.slice(0, 50).map((ch, i) => (
                  <tr key={`${ch.name}-${i}`} className="hover:bg-white/5">
                    <td className="px-4 py-2 text-gray-500">{i + 1}</td>
                    <td className="px-4 py-2 text-white">{ch.name}</td>
                    <td className="px-4 py-2 text-gray-400">{ch.category}</td>
                    <td className="px-4 py-2">
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        ch.quality === 'UHD' ? 'bg-yellow-900/30 text-yellow-400' :
                        ch.quality === 'FHD' ? 'bg-blue-900/30 text-blue-400' :
                        ch.quality === 'HD' ? 'bg-green-900/30 text-green-400' :
                        'bg-gray-800 text-gray-400'
                      }`}>
                        {ch.quality}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {parsedChannels.length > 50 && (
              <p className="text-center text-gray-500 py-3 text-sm">
                Showing 50 of {parsedChannels.length} channels
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImportChannels;
