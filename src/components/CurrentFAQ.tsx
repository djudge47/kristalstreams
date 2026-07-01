import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const questions = [
  ['What is Kristal Streams?', 'Kristal Streams provides 21,000+ live channels plus movies, TV shows, sports, and international content.'],
  ['Is there a free trial?', 'Yes. A 36-hour trial is available before purchasing a plan.'],
  ['Which plans are available?', 'Bronze is 1 month, Silver is 3 months, Gold is 6 months, and Platinum is 12 months.'],
  ['How many connections can I choose?', 'Every plan offers options for 1 through 5 simultaneous connections.'],
  ['Does every plan include the same content?', 'Yes. The broad channel and on-demand lineup is included across the paid plans; pricing changes by duration and connection count.'],
  ['Which devices are supported?', 'Supported options include Smart TVs, mobile devices, computers, Fire TV, Roku, Apple TV, and other compatible players.'],
  ['What quality is available?', 'HD and 4K are available where supported. Playback quality depends on the source, device, and internet speed.'],
  ['Can I cancel?', 'Yes. You can manage cancellation from your subscription settings.'],
];

const CurrentFAQ: React.FC = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="bg-dark-200 py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <header className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl">Frequently Asked Questions</h2>
          <p className="text-gray-400">Current information about plans, devices, and service access.</p>
        </header>
        <div className="mx-auto max-w-3xl">
          {questions.map(([question, answer], index) => (
            <div key={question} className="mb-4">
              <button onClick={() => setOpen(open === index ? null : index)} className={`flex w-full items-center justify-between rounded-lg p-5 text-left ${open === index ? 'bg-primary text-white' : 'bg-dark-100 text-gray-300'}`}>
                <span className="font-medium">{question}</span>
                {open === index ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
              {open === index && <div className="rounded-b-lg bg-dark-100 p-5 text-gray-400">{answer}</div>}
            </div>
          ))}
        </div>
        <div className="mt-10 text-center"><button onClick={() => navigate('/support')} className="rounded-lg bg-primary px-6 py-3 text-white">Contact Support</button></div>
      </div>
    </section>
  );
};

export default CurrentFAQ;
