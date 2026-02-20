import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Mic, MicOff, RefreshCw, Check, X, UserPlus } from 'lucide-react';
import { chatWithScheme, parseVoiceProfile } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

const Chat = () => {
  const { user, login } = useAuth();
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
  const [suggestedProfile, setSuggestedProfile] = useState<any>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Voice Input Logic
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  const recognition = useRef<any>(null);

  useEffect(() => {
    if (SpeechRecognition) {
      recognition.current = new SpeechRecognition();
      recognition.current.continuous = false;
      recognition.current.interimResults = false;
      recognition.current.lang = 'hi-IN'; // Default to Hindi for better profile extraction

      recognition.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
        // Automatically trigger profile extraction if it sounds like a self-intro
        if (transcript.length > 20) {
          handleExtractProfile(transcript);
        }
      };

      recognition.current.onerror = () => setIsListening(false);
      recognition.current.onend = () => setIsListening(false);
    }
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
        // Only suggest if AI actually found something
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
      // In a real app, we'd call an API to save this. 
      // For now, update context so it reflects in the session.
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
    <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[80vh]">
      <div className="p-4 border-b border-slate-100 bg-primary-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary-100 p-2 rounded-full">
            <Bot className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900">Niti-Setu Assistant</h2>
            <p className="text-xs text-primary-700 font-medium">
              {user ? `Personalized for ${user.name}` : 'Agricultural Scheme Expert'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-grow overflow-y-auto p-6 space-y-6 bg-slate-50/30">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`flex gap-3 max-w-[85%] ${
                msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${
                msg.sender === 'user' ? 'bg-white border border-slate-200' : 'bg-primary-600 text-white'
              }`}>
                {msg.sender === 'user' ? <User className="w-4 h-4 text-slate-600" /> : <Bot className="w-4 h-4" />}
              </div>
              
              <div className={`p-4 rounded-2xl shadow-sm text-sm leading-relaxed ${
                msg.sender === 'user' 
                  ? 'bg-slate-800 text-white rounded-tr-none' 
                  : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'
              }`}>
                {msg.text}
              </div>
            </div>
          </div>
        ))}

        {extracting && (
          <div className="flex justify-start">
            <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex items-center gap-3">
              <RefreshCw className="w-4 h-4 animate-spin text-amber-600" />
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">AI is extracting profile details...</span>
            </div>
          </div>
        )}

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
                {Object.entries(suggestedProfile).map(([key, value]) => (
                  value && (
                    <div key={key} className="bg-white/60 p-2 rounded-lg border border-indigo-100">
                      <p className="text-[10px] font-bold text-indigo-400 uppercase">{key}</p>
                      <p className="text-sm font-bold text-indigo-900">{String(value)}</p>
                    </div>
                  )
                ))}
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
              <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center flex-shrink-0 animate-pulse">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white border border-slate-100 p-4 rounded-2xl rounded-tl-none flex items-center gap-2 shadow-sm">
                <Loader2 className="w-4 h-4 animate-spin text-primary-500" />
                <span className="text-slate-500 text-sm">Reviewing documents...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-slate-100 bg-white">
        <form onSubmit={handleSend} className="relative flex items-center gap-2">
          <button
            type="button"
            onClick={toggleListening}
            className={`p-3 rounded-full transition-all ${
              isListening 
                ? 'bg-red-100 text-red-600 animate-pulse' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
            title={isListening ? "Listening..." : "Click to speak"}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
          
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isListening ? "Listening..." : "Ask about a scheme..."}
            className="flex-grow bg-slate-50 border-slate-200 border rounded-full py-3 px-6 focus:ring-4 focus:ring-primary-500/10 focus:bg-white focus:border-primary-500 transition-all outline-none text-sm"
            disabled={loading}
          />
          
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white p-3 rounded-full transition-all shadow-md shadow-primary-200 active:scale-95"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;