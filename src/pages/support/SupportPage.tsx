import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface SupportPageProps {
  title: string;
  description: string;
  sections: { heading: string; content: string }[];
  relatedLinks?: { title: string; url: string }[];
}

const SupportPage: React.FC<SupportPageProps> = ({ title, description, sections, relatedLinks }) => {
  useEffect(() => { window.scrollTo(0, 0); }, []);
  return (
    <div className="min-h-screen py-12 bg-dark-300">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <Link to="/support" className="text-gray-400 hover:text-white flex items-center mb-6">
            <ArrowLeft size={18} className="mr-2" />Back to Support
          </Link>
          <h1 className="text-3xl font-bold text-white mb-4">{title}</h1>
          <p className="text-gray-400 text-lg mb-8">{description}</p>
          <div className="space-y-8">
            {sections.map((s, i) => (
              <div key={i} className="bg-dark-100 rounded-xl p-6 border border-gray-800">
                <h2 className="text-xl font-semibold text-white mb-3">{s.heading}</h2>
                <p className="text-gray-300 leading-relaxed whitespace-pre-line">{s.content}</p>
              </div>
            ))}
          </div>
          {relatedLinks && relatedLinks.length > 0 && (
            <div className="mt-8 bg-dark-100 rounded-xl p-6 border border-gray-800">
              <h3 className="text-lg font-semibold text-white mb-4">Related Topics</h3>
              <div className="grid grid-cols-2 gap-3">
                {relatedLinks.map(l => (
                  <Link key={l.url} to={l.url} className="text-gray-300 hover:text-primary transition-colors">{l.title}</Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default SupportPage;
