import React from 'react';
import { Download, ChevronDown, HelpCircle } from 'lucide-react';

const apkUrl = '/downloads/KristalStreams.apk';

const guides = [
  {
    title: 'Firestick / Fire TV',
    steps: [
      'Select Get App on the Kristal Streams homepage.',
      'Open the downloaded kristalstreams.apk file from Downloads.',
      'Allow installation from the downloading app if Fire TV asks, then select Install.',
      'Open Kristal Streams and sign in with your service credentials.',
    ],
    note: 'Some Fire TV browsers may block APK downloads. Fire TV models running Vega OS cannot install Android APKs.',
  },
  {
    title: 'ONN / Android TV / Google TV',
    steps: [
      'Select Get App on the Kristal Streams homepage.',
      'Open kristalstreams.apk from Downloads or your file manager.',
      'Allow installation from that source if prompted, then install.',
      'Launch Kristal Streams and sign in.',
    ],
    note: 'If you see “App not installed,” check storage and whether a differently signed version is already installed. Keep your login details before removing an existing app.',
  },
  {
    title: 'Android phone / tablet',
    steps: [
      'Tap Get App on the Kristal Streams homepage.',
      'Open the downloaded kristalstreams.apk from notifications or Downloads.',
      'Allow installation when Android asks, then install.',
      'Open the app and sign in.',
    ],
    note: 'Android APKs do not install on iPhones or iPads.',
  },
  {
    title: 'Samsung / LG Smart TV',
    steps: [
      'Check the TV’s built-in apps or home screen for an IPTV or Live TV player that supports adding your own service.',
      'If there is no compatible built-in player, open the TV’s official app store and look for an IPTV player, such as IPTV Smarters if available.',
      'Open the compatible player and choose Xtream Codes login if it offers that option.',
      'Enter the server address, username and password provided for your Kristal Streams service.',
    ],
    note: 'Samsung Tizen and LG webOS cannot install kristalstreams.apk. Built-in Live TV apps do not always accept IPTV service credentials; use a compatible player or contact support for help.',
  },
  {
    title: 'Web browser',
    steps: [
      'Use the Sign In option on the Kristal Streams website if browser access is supported for your account.',
      'Sign in using your website credentials.',
      'Use the available account and streaming features.',
    ],
    note: 'You do not need an Android APK to access the website.',
  },
];

const DownloadApp: React.FC = () => (
  <main className="min-h-screen bg-dark-300 px-4 py-14 text-white">
    <div className="mx-auto max-w-3xl">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold sm:text-4xl">Get Kristal Streams</h1>
        <p className="mt-3 text-gray-300">Download the app for Firestick, ONN, Android TV, and Android phones.</p>
      </header>

      <section className="rounded-2xl border border-gray-700 bg-dark-100 px-6 py-8 text-center sm:px-10">
        <p className="mb-1 text-sm font-medium text-gray-300">Android APK · Version 9506 · 78.6 MB</p>
        <h2 className="mb-5 text-2xl font-bold">kristalstreams.apk</h2>
        <a href={apkUrl} download="kristalstreams.apk" className="inline-flex w-full items-center justify-center gap-3 rounded-lg bg-primary px-8 py-4 text-lg font-semibold text-white transition hover:opacity-90 sm:w-auto">
          <Download className="h-5 w-5" />
          Download App
        </a>
        <p className="mt-4 text-sm text-gray-400">Android 7.0 or newer. Your device may ask permission to install the file.</p>
      </section>

      <section className="mt-10" aria-labelledby="setup-help">
        <div className="mb-4 flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-primary" />
          <h2 id="setup-help" className="text-xl font-semibold">Need help installing?</h2>
        </div>
        <p className="mb-4 text-sm text-gray-400">Choose your device to see the steps. Guides stay closed until needed.</p>
        <div className="space-y-3">
          {guides.map((guide) => (
            <details key={guide.title} className="group rounded-xl border border-gray-700 bg-dark-100">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-semibold [&::-webkit-details-marker]:hidden">
                {guide.title}
                <ChevronDown className="h-5 w-5 shrink-0 text-gray-400 transition-transform group-open:rotate-180" />
              </summary>
              <div className="border-t border-gray-700 px-5 pb-5 pt-4">
                <ol className="list-decimal space-y-3 pl-5 text-sm leading-relaxed text-gray-300">
                  {guide.steps.map((step, index) => <li key={index}>{step}</li>)}
                </ol>
                <p className="mt-4 text-sm text-gray-400">{guide.note}</p>
              </div>
            </details>
          ))}
        </div>
      </section>

      <div className="mt-8 rounded-xl border border-gray-700 px-5 py-4 text-sm text-gray-300">
        <strong className="text-white">After installing:</strong> Open Kristal Streams, sign in, and select Live TV, Movies, or Series.
      </div>

      <p className="mt-7 text-center text-sm text-gray-400">
        Still need help? <a href="/support" className="font-semibold text-primary hover:underline">Visit Support Center</a>
      </p>
    </div>
  </main>
);

export default DownloadApp;
