import React, { useState } from 'react';
import { Activity, Download, Upload, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const SpeedTest: React.FC = () => {
  const [downloadSpeed, setDownloadSpeed] = useState<number | null>(null);
  const [uploadSpeed, setUploadSpeed] = useState<number | null>(null);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatSpeed = (speedBps: number): string => {
    if (speedBps >= 1000000) {
      return `${(speedBps / 1000000).toFixed(2)} Mbps`;
    }
    if (speedBps >= 1000) {
      return `${(speedBps / 1000).toFixed(2)} Kbps`;
    }
    return `${speedBps.toFixed(2)} bps`;
  };

  const runSpeedTest = async () => {
    setTesting(true);
    setError(null);
    setDownloadSpeed(null);
    setUploadSpeed(null);

    try {
      // Download speed test
      const downloadStartTime = performance.now();
      const downloadResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/speed-test?type=download`,
        {
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
        }
      );

      if (!downloadResponse.ok) throw new Error('Download test failed');

      const downloadData = await downloadResponse.arrayBuffer();
      const downloadEndTime = performance.now();
      const downloadDuration = (downloadEndTime - downloadStartTime) / 1000; // Convert to seconds
      const downloadSpeedBps = (downloadData.byteLength * 8) / downloadDuration;
      setDownloadSpeed(downloadSpeedBps);

      // Upload speed test
      const uploadData = new Uint8Array(5 * 1024 * 1024); // 5MB test file
      const uploadStartTime = performance.now();
      const uploadResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/speed-test?type=upload`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: uploadData,
        }
      );

      if (!uploadResponse.ok) throw new Error('Upload test failed');

      const uploadEndTime = performance.now();
      const uploadDuration = (uploadEndTime - uploadStartTime) / 1000; // Convert to seconds
      const uploadSpeedBps = (uploadData.length * 8) / uploadDuration;
      setUploadSpeed(uploadSpeedBps);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete speed test');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="min-h-screen py-32 bg-dark-300">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center mb-8">
            <Activity className="text-primary w-8 h-8 mr-4" />
            <h1 className="text-3xl font-bold text-white">Speed Test</h1>
          </div>

          <div className="bg-dark-100 rounded-xl p-8 border border-gray-800 mb-8">
            <p className="text-gray-300 mb-6">
              Test your connection speed to ensure optimal streaming quality. We recommend:
              <br />
              • At least 5 Mbps for HD streaming
              <br />
              • At least 25 Mbps for 4K streaming
            </p>

            <button
              onClick={runSpeedTest}
              disabled={testing}
              className="w-full bg-primary hover:bg-red-700 disabled:bg-gray-700 text-white py-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center"
            >
              {testing ? (
                <>
                  <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                  Testing Speed...
                </>
              ) : (
                <>
                  <Activity className="w-5 h-5 mr-2" />
                  Start Speed Test
                </>
              )}
            </button>

            {error && (
              <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500">
                {error}
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-dark-100 rounded-xl p-6 border border-gray-800">
              <div className="flex items-center mb-4">
                <Download className="text-primary w-6 h-6 mr-3" />
                <h2 className="text-xl font-semibold text-white">Download Speed</h2>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-2">
                  {downloadSpeed ? formatSpeed(downloadSpeed) : '---'}
                </div>
                <p className="text-gray-400">Incoming connection speed</p>
              </div>
            </div>

            <div className="bg-dark-100 rounded-xl p-6 border border-gray-800">
              <div className="flex items-center mb-4">
                <Upload className="text-primary w-6 h-6 mr-3" />
                <h2 className="text-xl font-semibold text-white">Upload Speed</h2>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-2">
                  {uploadSpeed ? formatSpeed(uploadSpeed) : '---'}
                </div>
                <p className="text-gray-400">Outgoing connection speed</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpeedTest;