import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Mic, MicOff, RefreshCw, Check, X, UserPlus, Sparkles } from 'lucide-react';
import { chatWithScheme, parseVoiceProfile } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

const Chat = () => {
  const { user, login } = useAuth();
  const isAdmin = user?.role === 'admin';

  if (isAdmin) {
    return <Navigate to="/admin/dashboard?chat=true" replace />;
  }

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Namaste! I'm Niti-Setu AI. I can help you find government agricultural schemes you are eligible for. You can type or use the microphone to talk to me.",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [suggestedProfile, setSuggestedProfile] = useState<Record<string, any> | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chatInputRef.current?.focus();
  }, []);

  // Voice Input Logic
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  const recognition = useRef<any>(null);

  useEffect(() => {
    if (SpeechRecognition) {
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
  }, []);

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
        const hasData = Object.values(response.profile).some(v => v !== null && v !== undefined && v !== '');
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
          ...suggestedProfile
        }
      };
      const token = localStorage.getItem('token') || '';
      login(updatedUser, token);
      setSuggestedProfile(null);
      
      const botMsg: Message = {
        id: Date.now(),
        text: "Dhanyawad! I have updated your profile with the details you mentioned. This will help me give you better recommendations.",
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMsg]);
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
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const userProfile = user?.profile || { state: 'Pan-India' };
      const response = await chatWithScheme(userMessage.text, userProfile);
      
      const botMessage: Message = {
        id: Date.now() + 1,
        text: response.answer || "I couldn't find an answer to that.",
        sender: 'bot',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error(error);
      const errorMessage: Message = {
        id: Date.now() + 1,
        text: "Sorry, I encountered an error. Please try again.",
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    /* 
       h-[calc(100dvh-64px)] ensures perfect fit on mobile address bars (dvh)
       Subtract 64px for the navbar.
       lg:h-[calc(100vh-14rem)] restores original desktop height.
    */
    <div className="flex flex-col h-[calc(100dvh-64px)] lg:h-[calc(100vh-14rem)] w-full lg:max-w-4xl lg:mx-auto bg-white lg:rounded-2xl lg:shadow-sm lg:border lg:border-slate-200 overflow-hidden transition-all">
      {/* Dynamic Header */}
      <div className={`px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-100 ${isAdmin ? 'bg-indigo-50' : 'bg-white lg:bg-primary-50'} flex items-center justify-between flex-shrink-0 sticky top-0 z-10 shadow-sm lg:shadow-none lg:static`}>
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className={`${isAdmin ? 'bg-indigo-100' : 'bg-primary-50 lg:bg-primary-100'} p-2 rounded-xl lg:rounded-full`}>
              <Bot className={`w-5 h-5 sm:w-6 sm:h-6 ${isAdmin ? 'text-indigo-600' : 'text-primary-600'}`} />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full lg:hidden"></div>
          </div>
          <div>
            <h2 className="font-bold lg:font-semibold text-slate-900 text-sm sm:text-base leading-none mb-1 lg:mb-0">
              Niti-Setu {lgHiddenSpan('AI Assistant')}
            </h2>
            <p className={`text-[10px] sm:text-xs font-bold lg:font-medium ${isAdmin ? 'text-indigo-600' : 'text-primary-600 lg:text-primary-700'} uppercase lg:capitalize tracking-wide lg:tracking-normal`}>
              {user ? `Personalized for ${user.name}` : 'Agricultural Scheme Expert'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 lg:hidden">
          <Sparkles className="w-4 h-4 text-slate-400" />
        </div>
      </div>

      {/* Message Area */}
      <div className="flex-grow overflow-y-auto p-4 sm:p-6 space-y-6 bg-[#F8F9FD] lg:bg-slate-50/30">
        <div className="text-center mb-8">
          <span className="bg-slate-200/50 text-slate-500 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
            Today
          </span>
        </div>

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`flex ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'} gap-2 sm:gap-3 max-w-[90%] sm:max-w-[85%]`}
            >
              {/* Desktop-only Avatar */}
              <div className={`hidden lg:flex w-8 h-8 rounded-full items-center justify-center flex-shrink-0 shadow-sm ${
                msg.sender === 'user' 
                  ? 'bg-white border border-slate-200' 
                  : (isAdmin ? 'bg-indigo-600 text-white' : 'bg-primary-600 text-white')
              }`}>
                {msg.sender === 'user' ? <User className="w-4 h-4 text-slate-600" /> : <Bot className="w-4 h-4" />}
              </div>

              <div className={`flex flex-col gap-1`}>
                <div className={`px-4 py-3 rounded-2xl text-sm lg:text-sm shadow-sm ${
                  msg.sender === 'user' 
                    ? 'bg-primary-600 lg:bg-slate-800 text-white rounded-tr-none' 
                    : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'
                }`}>
                  {msg.text}
                </div>
                <span className={`text-[9px] font-bold text-slate-400 uppercase ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          </div>
        ))}

        {extracting && (
          <div className="flex justify-start">
            <div className="bg-white border border-amber-100 px-4 py-2.5 rounded-2xl flex items-center gap-3 shadow-sm">
              <RefreshCw className="w-3 h-3 animate-spin text-amber-600" />
              <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">AI is processing...</span>
            </div>
          </div>
        )}

        {suggestedProfile && (
          <div className="flex justify-start animate-in fade-in zoom-in-95 duration-300">
            <div className="bg-white border border-indigo-100 rounded-2xl p-5 w-full max-w-[280px] shadow-lg space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-indigo-50 rounded-lg">
                  <UserPlus className="w-4 h-4 text-indigo-600" />
                </div>
                <h4 className="font-bold text-xs text-indigo-900 uppercase">Update Profile?</h4>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {Object.entries(suggestedProfile).map(([key, value]) => (
                  value ? (
                    <div key={`profile-${key}`} className="flex justify-between items-center bg-slate-50 px-2 py-1.5 rounded-lg border border-slate-100">
                      <span className="text-[9px] font-bold text-slate-400 uppercase">{key}</span>
                      <span className="text-[10px] font-bold text-slate-900">{String(value)}</span>
                    </div>
                  ) : null
                ))}
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={applyProfileUpdate}
                  className="flex-1 bg-indigo-600 text-white py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider shadow-md"
                >
                  Save
                </button>
                <button 
                  onClick={() => setSuggestedProfile(null)}
                  className="px-3 bg-slate-100 text-slate-400 py-2 rounded-xl"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex justify-start">
            <div className="flex gap-3 max-w-[80%]">
              <div className={`w-8 h-8 rounded-full ${isAdmin ? 'bg-indigo-600' : 'bg-primary-600'} flex items-center justify-center flex-shrink-0 animate-pulse`}>
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white border border-slate-100 p-4 rounded-2xl rounded-tl-none flex items-center gap-2 shadow-sm">
                <Loader2 className={`w-4 h-4 animate-spin ${isAdmin ? 'text-indigo-500' : 'text-primary-500'}`} />
                <span className="text-slate-500 text-sm">Reviewing...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="px-4 py-3 sm:px-6 sm:py-4 border-t border-slate-100 bg-white sticky bottom-0 lg:static">
        <form onSubmit={handleSend} className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={toggleListening}
            className={`p-3 rounded-xl lg:rounded-full transition-all active:scale-90 flex-shrink-0 ${
              isListening 
                ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-200' 
                : 'bg-slate-100 text-slate-500'
            }`}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
          
          <input
            ref={chatInputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isListening ? "Listening..." : "Ask Niti-Setu..."}
            className={`flex-grow bg-slate-50 border-slate-200 lg:border rounded-xl lg:rounded-full py-3 px-4 lg:px-6 focus:ring-4 ${isAdmin ? 'focus:ring-indigo-500/10 focus:border-indigo-500' : 'focus:ring-primary-500/10 focus:border-primary-500'} transition-all outline-none text-sm lg:bg-slate-50 lg:focus:bg-white`}
            disabled={loading}
          />
          
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className={`p-3 rounded-xl lg:rounded-full transition-all active:scale-90 flex-shrink-0 ${
              isAdmin 
                ? 'bg-indigo-600 text-white shadow-lg lg:shadow-md' 
                : 'bg-primary-600 text-white shadow-lg lg:shadow-md'
            } disabled:opacity-50 disabled:shadow-none`}
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

// Helper to keep code clean
const lgHiddenSpan = (text: string) => <span className="hidden lg:inline">{text}</span>;

export default Chat;
