import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { ingestScheme } from '../services/api';

const Ingest = () => {
  const [file, setFile] = useState<File | null>(null);
  const [schemeName, setSchemeName] = useState('');
  const [benefitsValue, setBenefitsValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !schemeName) {
      setStatus({ type: 'error', message: 'Please provide a file and scheme name.' });
      return;
    }

    setLoading(true);
    setStatus(null);

    const formData = new FormData();
    formData.append('pdf', file);
    formData.append('schemeName', schemeName);
    formData.append('benefitsValue', benefitsValue);
    formData.append('benefitsType', 'Financial'); // Defaulting for now

    try {
      const response = await ingestScheme(formData);
      if (response.success) {
        setStatus({ type: 'success', message: 'Scheme uploaded and processed successfully!' });
        setFile(null);
        setSchemeName('');
        setBenefitsValue('');
      } else {
        setStatus({ type: 'error', message: response.error || 'Upload failed.' });
      }
    } catch (error: any) {
        console.log(error)
      setStatus({ type: 'error', message: error.message || 'An error occurred during upload.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-primary-100 rounded-xl">
            <Upload className="w-8 h-8 text-primary-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Upload New Scheme</h1>
            <p className="text-slate-500">Ingest PDF documents to the AI knowledge base.</p>
          </div>
        </div>

        {status && (
          <div className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${
            status.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {status.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
            <p>{status.message}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Scheme Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={schemeName}
              onChange={(e) => setSchemeName(e.target.value)}
              className="w-full rounded-lg border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 p-2.5"
              placeholder="e.g., Pradhan Mantri Awas Yojana"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Max Benefit Value (INR)
            </label>
            <input
              type="number"
              value={benefitsValue}
              onChange={(e) => setBenefitsValue(e.target.value)}
              className="w-full rounded-lg border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 p-2.5"
              placeholder="e.g., 50000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Scheme Document (PDF) <span className="text-red-500">*</span>
            </label>
            <div className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-xl transition-colors ${
                file ? 'border-primary-300 bg-primary-50' : 'border-slate-300 hover:border-primary-400'
            }`}>
              <div className="space-y-1 text-center">
                <FileText className={`mx-auto h-12 w-12 ${file ? 'text-primary-500' : 'text-slate-400'}`} />
                <div className="flex text-sm text-slate-600 justify-center">
                  <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none">
                    <span>{file ? file.name : 'Upload a file'}</span>
                    <input id="file-upload" name="file-upload" type="file" className="sr-only" accept=".pdf" onChange={handleFileChange} />
                  </label>
                </div>
                {!file && <p className="text-xs text-slate-500">PDF up to 10MB</p>}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 disabled:opacity-70 transition-all"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Processing...
              </>
            ) : (
              'Upload Scheme'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Ingest;