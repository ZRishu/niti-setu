import React, { useEffect, useState, useRef } from 'react';
import { getAllSchemes, ingestScheme, chatWithScheme, parseVoiceProfile } from '../services/api';
import {
  Upload,
  History,
  FileText,
  Calendar,
  ChevronRight,
  ExternalLink,
  Loader2,
  AlertCircle,
  X,
  CheckCircle,
  ShieldCheck,
  Search,
  IndianRupee,
  MessageSquare,
  Bot,
  User,
  Mic,
  MicOff,
  Send,
  UserPlus,
  Check,
  Sparkles,
  Database,
} from 'lucide-react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

const ChatModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const { user, login } = useAuth();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Namaste! I'm Niti-Setu AI. I can help you find government agricultural schemes you are eligible for. You can type or use the microphone to talk to me.",
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [suggestedProfile, setSuggestedProfile] = useState<Record<string, any> | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        chatInputRef.current?.focus();
      }, 300);
    }
  }, [isOpen]);

  // Voice Input Logic
  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  const recognition = useRef<any>(null);

  useEffect(() => {
    if (SpeechRecognition && isOpen) {
      recognition.current = new SpeechRecognition();
      recognition.current.continuous = false;
      recognition.current.interimResults = false;
      recognition.current.lang = 'hi-IN';

      recognition.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
        if (transcript.length > 20) {
          handleExtractProfile(transcript);
        }
      };

      recognition.current.onerror = () => setIsListening(false);
      recognition.current.onend = () => setIsListening(false);
    }

    return () => {
      if (recognition.current) {
        recognition.current.stop();
      }
    };
  }, [isOpen]);

  const toggleListening = () => {
    if (isListening) {
      recognition.current?.stop();
    } else {
      setIsListening(true);
      recognition.current?.start();
    }
  };

  const handleExtractProfile = async (text: string) => {
    setExtracting(true);
    try {
      const response = await parseVoiceProfile(text);
      if (response.success && response.profile) {
        const hasData = Object.values(response.profile).some(
          (v) => v !== null && v !== undefined && v !== ''
        );
        if (hasData) {
          setSuggestedProfile(response.profile);
        }
      }
    } catch (err) {
      console.error('Profile extraction failed:', err);
    } finally {
      setExtracting(false);
    }
  };

  const applyProfileUpdate = () => {
    if (user && suggestedProfile) {
      const updatedUser = {
        ...user,
        profile: {
          ...user.profile,
          ...suggestedProfile,
        },
      };
      const token = localStorage.getItem('token') || '';
      login(updatedUser, token);
      setSuggestedProfile(null);

      const botMsg: Message = {
        id: Date.now(),
        text: 'Dhanyawad! I have updated your profile with the details you mentioned. This will help me give you better recommendations.',
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMsg]);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, suggestedProfile, extracting]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now(),
      text: input,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const userProfile = user?.profile || { state: 'Pan-India' };
      const response = await chatWithScheme(userMessage.text, userProfile);

      const botMessage: Message = {
        id: Date.now() + 1,
        text: response.answer || "I couldn't find an answer to that.",
        sender: 'bot',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error(error);
      const errorMessage: Message = {
        id: Date.now() + 1,
        text: 'Sorry, I encountered an error. Please try again.',
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] overflow-hidden">
      <div className="flex items-center justify-center min-h-screen sm:min-h-0 sm:h-full p-0 sm:p-4">
        {/* Desktop overlay - hidden on mobile */}
        <div
          className="hidden sm:block fixed inset-0 transition-opacity"
          aria-hidden="true"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"></div>
        </div>

        {/* Modal content - full screen on mobile, contained on desktop */}
        <div className="relative bg-white rounded-none sm:rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all w-full min-h-screen sm:min-h-0 sm:w-full sm:max-w-4xl sm:h-auto sm:max-h-[90vh] border-0 sm:border border-slate-100 animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300 sm:duration-200 flex flex-col">
          <div
            className={`p-4 sm:p-4 border-b border-slate-100 bg-indigo-50 flex items-center justify-between flex-shrink-0 safe-top`}
          >
            <div className="flex items-center gap-3">
              <div className={`bg-indigo-100 p-2 rounded-full`}>
                <Bot className={`w-6 h-6 text-indigo-600`} />
              </div>
              <div>
                <h2 className="font-semibold text-slate-900">Niti-Setu Assistant</h2>
                <p className={`text-xs text-indigo-700 font-medium`}>Admin Control Mode</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 hover:bg-white rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-grow overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-50/30">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`flex gap-3 max-w-[90%] sm:max-w-[85%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${msg.sender === 'user' ? 'bg-white border border-slate-200' : 'bg-indigo-600 text-white'}`}
                  >
                    {msg.sender === 'user' ? (
                      <User className="w-4 h-4 text-slate-600" />
                    ) : (
                      <Bot className="w-4 h-4" />
                    )}
                  </div>
                  <div
                    className={`p-4 rounded-2xl shadow-sm text-sm leading-relaxed ${msg.sender === 'user' ? 'bg-slate-800 text-white rounded-tr-none' : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'}`}
                  >
                    {msg.text}
                  </div>
                </div>
              </div>
            ))}

            {suggestedProfile && (
              <div className="flex justify-start animate-in zoom-in-95 duration-300">
                <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 max-w-sm shadow-md space-y-4">
                  <div className="flex items-center gap-2 text-indigo-900 mb-2">
                    <UserPlus className="w-5 h-5" />
                    <h4 className="font-bold">Update your profile?</h4>
                  </div>
                  <p className="text-xs text-indigo-700 leading-relaxed">
                    I noticed some details about you. Should I save them to your profile?
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(suggestedProfile || {}).map(
                      ([key, value]) =>
                        value && (
                          <div
                            key={`profile-${key}`}
                            className="bg-white/60 p-2 rounded-lg border border-indigo-100"
                          >
                            <p className="text-[10px] font-bold text-indigo-400 uppercase">{key}</p>
                            <p className="text-sm font-bold text-indigo-900">{String(value)}</p>
                          </div>
                        )
                    )}
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={applyProfileUpdate}
                      className="flex-grow bg-indigo-600 text-white py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 hover:bg-indigo-700 transition-all"
                    >
                      <Check className="w-4 h-4" /> Save
                    </button>
                    <button
                      onClick={() => setSuggestedProfile(null)}
                      className="px-4 border border-indigo-200 text-indigo-600 py-2 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-all"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {loading && (
              <div className="flex justify-start">
                <div className="flex gap-3 max-w-[80%]">
                  <div
                    className={`w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0 animate-pulse`}
                  >
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-white border border-slate-100 p-4 rounded-2xl rounded-tl-none flex items-center gap-2 shadow-sm">
                    <Loader2 className={`w-4 h-4 animate-spin text-indigo-600`} />
                    <span className="text-slate-500 text-sm">AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 sm:p-4 border-t border-slate-100 bg-white safe-bottom flex-shrink-0">
            <form onSubmit={handleSend} className="relative flex items-center gap-2 w-full">
              <button
                type="button"
                onClick={toggleListening}
                className={`p-2.5 sm:p-3 rounded-full transition-all flex-shrink-0 ${isListening ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                {isListening ? (
                  <MicOff className="w-4 h-4 sm:w-5 sm:h-5" />
                ) : (
                  <Mic className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
              </button>
              <input
                ref={chatInputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about a scheme..."
                className="flex-1 min-w-0 bg-slate-50 border-slate-200 border rounded-full py-2.5 px-4 sm:py-3 sm:px-6 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all outline-none text-sm"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100 disabled:opacity-50 text-white p-2.5 sm:p-3 rounded-full transition-all shadow-md active:scale-95 flex-shrink-0"
              >
                <Send className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

const IngestModal = ({
  isOpen,
  onClose,
  onRefresh,
}: {
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [schemeName, setSchemeName] = useState('');
  const [benefitsValue, setBenefitsValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 300);
    }
  }, [isOpen]);

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
    formData.append('benefitsType', 'Financial');

    try {
      const response = await ingestScheme(formData);
      if (response.success) {
        setStatus({ type: 'success', message: 'Scheme uploaded and processed successfully!' });
        setFile(null);
        setSchemeName('');
        setBenefitsValue('');
        onRefresh();
        setTimeout(() => {
          onClose();
          setStatus(null);
        }, 2000);
      } else {
        setStatus({ type: 'error', message: response.error || 'Upload failed.' });
      }
    } catch (error: any) {
      setStatus({ type: 'error', message: error.message || 'An error occurred during upload.' });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] overflow-hidden">
      <div className="flex items-center justify-center min-h-screen sm:min-h-0 sm:h-full p-0 sm:p-4">
        {/* Desktop overlay - hidden on mobile */}
        <div
          className="hidden sm:block fixed inset-0 transition-opacity"
          aria-hidden="true"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"></div>
        </div>

        {/* Modal content - full screen on mobile, contained on desktop */}
        <div className="relative bg-white rounded-none sm:rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all w-full min-h-screen sm:min-h-0 sm:max-w-xl sm:w-full border-0 sm:border border-slate-100 animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300 sm:duration-200 flex flex-col">
          <div className="bg-white px-6 py-6 sm:p-8 flex-shrink-0 safe-top">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600">
                  <Upload className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Ingest New Scheme</h3>
              </div>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 hover:bg-slate-50 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {status && (
              <div
                className={`mb-6 p-4 rounded-xl flex items-start gap-3 border animate-in slide-in-from-top-2 duration-300 ${
                  status.type === 'success'
                    ? 'bg-green-50 border-green-100 text-green-700'
                    : 'bg-red-50 border-red-100 text-red-700'
                }`}
              >
                {status.type === 'success' ? (
                  <CheckCircle className="w-5 h-5 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 shrink-0" />
                )}
                <p className="text-sm font-medium">{status.message}</p>
              </div>
            )}
          </div>

          <div className="flex-grow overflow-y-auto px-6 sm:px-8 pb-6 sm:pb-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                  Scheme Name
                </label>
                <input
                  ref={nameInputRef}
                  type="text"
                  required
                  value={schemeName}
                  onChange={(e) => setSchemeName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 p-3 text-slate-900 text-sm placeholder-slate-400 outline-none transition-all"
                  placeholder="e.g., PM Kisan Samman Nidhi"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                  Max Benefit Value (INR)
                </label>
                <input
                  type="number"
                  value={benefitsValue}
                  onChange={(e) => setBenefitsValue(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 p-3 text-slate-900 text-sm placeholder-slate-400 outline-none transition-all"
                  placeholder="e.g., 6000"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                  Scheme Document (PDF)
                </label>
                <label
                  htmlFor="file-upload"
                  className={`mt-1 flex justify-center px-6 pt-8 pb-9 border-2 border-dashed rounded-2xl transition-all cursor-pointer block hover:bg-slate-50/50 ${
                    file
                      ? 'border-indigo-500 bg-indigo-50/30'
                      : 'border-slate-200 bg-slate-50/30 hover:border-indigo-300'
                  }`}
                >
                  <div className="space-y-2 text-center">
                    <div
                      className={`mx-auto p-3 rounded-full w-fit ${file ? 'bg-indigo-100' : 'bg-slate-100'}`}
                    >
                      <FileText
                        className={`h-8 w-8 ${file ? 'text-indigo-600' : 'text-slate-400'}`}
                      />
                    </div>
                    <div className="flex text-sm text-slate-600 justify-center">
                      <span className="relative rounded-md font-bold text-indigo-600 hover:text-indigo-500">
                        {file ? file.name : 'Choose a file'}
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          className="sr-only"
                          accept=".pdf"
                          onChange={handleFileChange}
                        />
                      </span>
                    </div>
                    {!file && (
                      <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">
                        PDF format only
                      </p>
                    )}
                  </div>
                </label>
              </div>

              <div className="pt-2 safe-bottom">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-indigo-100 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 transition-all active:scale-[0.98]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Processing AI Model...
                    </>
                  ) : (
                    'Start AI Ingestion'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

const HistoryModal = ({
  isOpen,
  onClose,
  schemes,
}: {
  isOpen: boolean;
  onClose: () => void;
  schemes: any[];
}) => {
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [valueFilter, setValueFilter] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      const q = searchParams.get('q');
      if (q) setQuery(q);

      // Focus after modal animation
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 300);
    }
  }, [isOpen, searchParams]);

  const filtered = schemes.filter((s) => {
    const matchesName = s.name.toLowerCase().includes(query.toLowerCase());
    const matchesDate =
      !dateFilter || new Date(s.createdAt).toLocaleDateString().includes(dateFilter);
    const matchesValue =
      !valueFilter ||
      (s.benefits?.max_value_inr && s.benefits.max_value_inr >= parseInt(valueFilter));
    return matchesName && matchesDate && matchesValue;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] overflow-hidden">
      <div className="flex items-center justify-center min-h-screen sm:min-h-0 sm:h-full p-0 sm:p-4">
        {/* Desktop overlay - hidden on mobile */}
        <div
          className="hidden sm:block fixed inset-0 transition-opacity"
          aria-hidden="true"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"></div>
        </div>

        {/* Modal content - full screen on mobile, contained on desktop */}
        <div className="relative bg-white rounded-none sm:rounded-3xl text-left overflow-hidden shadow-2xl transform transition-all w-full min-h-screen sm:min-h-0 sm:max-w-4xl sm:w-full border-0 sm:border border-slate-100 animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300 sm:duration-200 flex flex-col">
          <div className="bg-white px-6 py-6 sm:p-8 flex-shrink-0 safe-top">
            <div className="flex items-center justify-between mb-6 sm:mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-50 rounded-xl text-amber-600">
                  <History className="w-6 h-6" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900">Ingestion History</h3>
              </div>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-50 rounded-full"
              >
                <X className="w-5 sm:w-6 h-5 sm:h-6" />
              </button>
            </div>

            {/* Advanced Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search by name..."
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Date (DD/MM/YYYY)"
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                />
              </div>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="number"
                  placeholder="Min Value (INR)"
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                  value={valueFilter}
                  onChange={(e) => setValueFilter(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="flex-grow overflow-y-auto px-6 sm:px-8 pb-6 sm:pb-8 safe-bottom">
            <div className="rounded-2xl border border-slate-100 overflow-hidden">
              {/* Mobile view - card layout */}
              <div className="block sm:hidden divide-y divide-slate-100">
                {filtered.map((scheme) => (
                  <div key={scheme._id} className="p-4 hover:bg-slate-50/50 transition-colors">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-grow min-w-0">
                          <h4 className="font-bold text-slate-800 text-sm leading-tight">
                            {scheme.name}
                          </h4>
                          <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1 mt-1">
                            <Calendar className="w-3 h-3" />{' '}
                            {new Date(scheme.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <p className="text-sm font-bold text-slate-600">
                            ₹{scheme.benefits?.max_value_inr?.toLocaleString() || 0}
                          </p>
                        </div>
                      </div>
                      <Link
                        to={`/search?q=${encodeURIComponent(scheme.name)}`}
                        className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-white hover:bg-indigo-600 transition-all px-3 py-2 rounded-lg border border-indigo-100"
                      >
                        Verify AI
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                ))}
                {filtered.length === 0 && (
                  <div className="p-12 text-center text-slate-400 italic">
                    No matching schemes found.
                  </div>
                )}
              </div>

              {/* Desktop view - table layout */}
              <table className="hidden sm:table w-full text-left border-collapse">
                <thead className="sticky top-0 bg-slate-50 z-10">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Scheme Details
                    </th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">
                      Value
                    </th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map((scheme) => (
                    <tr key={scheme._id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800">{scheme.name}</span>
                          <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1 mt-1">
                            <Calendar className="w-3 h-3" />{' '}
                            {new Date(scheme.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm font-bold text-slate-600">
                          ₹{scheme.benefits?.max_value_inr?.toLocaleString() || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          to={`/search?q=${encodeURIComponent(scheme.name)}`}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-white hover:bg-indigo-600 transition-all px-3 py-1.5 rounded-lg border border-indigo-100"
                        >
                          Verify AI
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-6 py-12 text-center text-slate-400 italic">
                        No matching schemes found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminDashboard: React.FC = () => {
  const [schemes, setSchemes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isIngestOpen, setIsIngestOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('chat') === 'true') setIsChatOpen(true);
    if (params.get('history') === 'true') setIsHistoryOpen(true);
  }, [location]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await getAllSchemes();
      if (response.success) setSchemes(response.data);
    } catch (err) {
      console.error(err);
      setError('Connection failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <div className="animate-fade-in pb-12">
      {/* MOBILE ADMIN LAYOUT */}
      <div className="block lg:hidden space-y-6">
        <div className="flex items-center justify-between px-1">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Admin Dashboard</h1>
            <p className="text-[11px] text-indigo-600 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Database className="w-3 h-3" /> Control Center
            </p>
          </div>
          <div className="bg-indigo-600 p-2.5 rounded-xl shadow-lg shadow-indigo-100">
            {loading ? (
              <Loader2 className="h-5 w-5 text-white animate-spin" />
            ) : (
              <ShieldCheck className="h-5 w-5 text-white" />
            )}
          </div>
        </div>

        {/* Action Grid */}
        <div className="space-y-4">
          <button
            onClick={() => setIsIngestOpen(true)}
            className="w-full bg-indigo-600 p-6 rounded-[2rem] shadow-xl shadow-indigo-100 flex flex-col items-start text-left relative overflow-hidden active:scale-[0.98] transition-all"
          >
            <Upload className="absolute -bottom-2 -right-2 h-24 w-24 text-white opacity-10" />
            <div className="p-3 bg-white/20 backdrop-blur-md rounded-xl mb-4">
              <Upload className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-white leading-none mb-2">Ingest New Scheme</h3>
            <p className="text-indigo-100 text-[11px] font-medium max-w-[180px]">
              Train the AI with new government PDF documents.
            </p>
          </button>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setIsHistoryOpen(true)}
              className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col items-start text-left active:bg-slate-50 transition-all"
            >
              <div className="p-2.5 bg-amber-50 rounded-xl mb-3">
                <History className="h-5 w-5 text-amber-600" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">History</h3>
              <p className="text-slate-400 text-[10px] mt-1">{schemes.length} Docs Ingested</p>
            </button>

            <button
              onClick={() => setIsChatOpen(true)}
              className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col items-start text-left active:bg-slate-50 transition-all"
            >
              <div className="p-2.5 bg-indigo-50 rounded-xl mb-3">
                <MessageSquare className="h-5 w-5 text-indigo-600" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">AI Assistant</h3>
              <p className="text-slate-400 text-[10px] mt-1">Verify Responses</p>
            </button>
          </div>
        </div>

        <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-[11px] font-medium text-indigo-800 leading-tight">
            Use the **AI Ingestion** to keep the model updated with the latest scheme guidelines.
          </p>
        </div>
      </div>

      {/* DESKTOP ADMIN LAYOUT - RESTORED FROM 5b528fa */}
      <div className="hidden lg:block">
        <div className="max-w-5xl mx-auto space-y-4 animate-fade-in -mt-4">
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-indigo-600 font-bold uppercase tracking-[0.2em] text-[10px]">
                <div className="h-1 w-4 bg-indigo-600 rounded-full" />
                Control Center
              </div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight">Admin Dashboard</h1>
              <p className="text-slate-500 font-medium max-w-lg">
                Monitor, manage, and train the Niti-Setu intelligence engine.
              </p>
            </div>
            <div className="bg-white p-4 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 flex items-center gap-4 group hover:scale-105 transition-all">
              <div className="bg-indigo-600 p-3 rounded-2xl shadow-lg shadow-indigo-200">
                {loading ? (
                  <Loader2 className="h-6 w-6 text-white animate-spin" />
                ) : (
                  <FileText className="h-6 w-6 text-white" />
                )}
              </div>
              <div className="pr-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Live Schemes</p>
                <p className="text-sm font-black text-indigo-600 flex items-center gap-1.5">
                  {schemes.length} Documents
                </p>
              </div>
            </div>
          </header>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl flex items-center gap-3">
              <AlertCircle className="h-5 w-5" />
              <p className="font-medium">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Primary Action: Ingest */}
            <button
              onClick={() => setIsIngestOpen(true)}
              className="relative bg-indigo-600 p-8 rounded-[2.5rem] shadow-2xl shadow-indigo-200 overflow-hidden group hover:-translate-y-1 transition-all duration-300"
            >
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                <Upload className="h-32 w-32 text-white" />
              </div>
              <div className="relative z-10 flex flex-col items-start text-left space-y-4">
                <div className="p-4 bg-white/20 backdrop-blur-md rounded-2xl">
                  <Upload className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white tracking-tight">Ingest Scheme</h3>
                  <p className="text-indigo-100/80 text-sm font-medium max-w-[200px]">
                    Upload new government PDF documents to train the AI.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-white font-bold text-xs bg-black/10 px-4 py-2 rounded-full backdrop-blur-sm group-hover:bg-black/20 transition-all">
                  Launch Uploader <ChevronRight className="h-4 w-4" />
                </div>
              </div>
            </button>

            {/* Secondary Action: History/Search */}
            <button
              onClick={() => setIsHistoryOpen(true)}
              className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col items-start text-left space-y-4 group hover:-translate-y-1 transition-all duration-300"
            >
              <div className="p-4 bg-amber-50 rounded-2xl group-hover:bg-amber-100 transition-colors">
                <History className="h-8 w-8 text-amber-600" />
              </div>
              <div className="flex-grow">
                <h3 className="text-2xl font-bold text-slate-900 tracking-tight">View History</h3>
                <p className="text-slate-500 text-sm font-medium">
                  Search and manage {schemes.length} previously ingested schemes.
                </p>
              </div>
              <div className="w-full flex items-center justify-between pt-2">
                <div className="flex -space-x-2">
                  {[...Array(Math.min(3, schemes.length))].map((_, i) => (
                    <div
                      key={i}
                      className="h-8 w-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center"
                    >
                      <FileText className="h-4 w-4 text-slate-400" />
                    </div>
                  ))}
                  {schemes.length > 3 && (
                    <div className="h-8 w-8 rounded-full border-2 border-white bg-indigo-50 flex items-center justify-center text-[10px] font-bold text-indigo-600">
                      +{schemes.length - 3}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs bg-indigo-50 px-4 py-2 rounded-full group-hover:bg-indigo-100 transition-all">
                  Manage History <Search className="h-4 w-4" />
                </div>
              </div>
            </button>
          </div>

          {/* AI Assistant Button (Admin Only) */}
          <div className="pt-2">
            <button
              onClick={() => setIsChatOpen(true)}
              className="w-full bg-white border border-indigo-100 p-6 rounded-[2rem] shadow-lg shadow-indigo-50 flex items-center justify-between group hover:border-indigo-300 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-slate-900">AI Assistant Control</h3>
                  <p className="text-xs text-slate-500">
                    Test AI responses and scheme knowledge directly.
                  </p>
                </div>
              </div>
              <div className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl text-xs font-bold group-hover:bg-indigo-600 group-hover:text-white transition-all flex items-center gap-2">
                Open Chat <ChevronRight className="h-4 w-4" />
              </div>
            </button>
          </div>
        </div>
      </div>
      <IngestModal
        isOpen={isIngestOpen}
        onClose={() => setIsIngestOpen(false)}
        onRefresh={fetchHistory}
      />

      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        schemes={schemes}
      />

      <ChatModal isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
};

export default AdminDashboard;
