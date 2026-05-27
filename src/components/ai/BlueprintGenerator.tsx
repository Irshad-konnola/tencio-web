import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { Send, Loader2, Sparkles, CheckCircle2, Bot, AlertCircle } from 'lucide-react';

export default function BlueprintGenerator() {
  const [input, setInput] = useState('');

  // Added setMessages to manually clear the chat history after submission
  const { messages, sendMessage, status, error, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/blueprint',
    }),
    onError: (err) => console.error("Chat Error:", err)
  });

  const isLoading = status === 'submitted' || status === 'streaming';
  const [blueprint, setBlueprint] = useState<any>(null);
  
  // Controlled inputs for the Lead Form
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadStatus, setLeadStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const [leadForm, setLeadForm] = useState({ name: '', contact: '' });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Robust Blueprint Parser
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    const content = lastMessage?.parts
      ?.filter((p: any) => p.type === 'text')
      .map((p: any) => p.text)
      .join('') || '';

    if (lastMessage?.role === 'assistant' && content.includes('[BLUEPRINT_START]')) {
      const startIndex = content.indexOf('[BLUEPRINT_START]') + '[BLUEPRINT_START]'.length;
      const endIndex = content.indexOf('[BLUEPRINT_END]');
      
      if (endIndex > -1) {
        let jsonStr = content.substring(startIndex, endIndex).trim();
        jsonStr = jsonStr.replace(/^```json/i, '').replace(/^```/, '').replace(/```$/, '').trim();
        
        try {
          const parsed = JSON.parse(jsonStr);
          setBlueprint(parsed);
        } catch (e) {
          console.error("Failed to parse blueprint JSON:", e);
        }
      }
    }
  }, [messages]);

  // Handle Lead Submission & Reset
  const handleLeadSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLeadStatus('loading');
    
    const data = {
      name: leadForm.name,
      contact: leadForm.contact,
      blueprint: blueprint,
      history: messages.map(m => ({ 
        role: m.role, 
        content: m.parts?.filter((p: any) => p.type === 'text').map((p: any) => p.text).join('') || ''
      }))
    };

    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (res.ok) {
        setLeadStatus('success');
        setLeadForm({ name: '', contact: '' }); // Instantly clear inputs
        
        // Wait 3 seconds, then completely reset the AI widget
        setTimeout(() => {
          setShowLeadForm(false);
          setLeadStatus('idle');
          setBlueprint(null);
          setMessages([]); // Wipes chat history
        }, 3000);
      } else {
        setLeadStatus('idle');
      }
    } catch (e) {
      setLeadStatus('idle');
    }
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || !!blueprint || isLoading) return;
    sendMessage({ text: input });
    setInput('');
  };

  // Strip JSON payload from visible chat
  const displayMessages = messages.map(m => {
    const content = m.parts?.filter((p: any) => p.type === 'text').map((p: any) => p.text).join('') || '';
    if (m.role === 'assistant' && content.includes('[BLUEPRINT_START]')) {
      const startIndex = content.indexOf('[BLUEPRINT_START]');
      return { ...m, displayContent: content.substring(0, startIndex).trim() };
    }
    return { ...m, displayContent: content };
  }).filter(m => m.displayContent.trim() !== '');

  const SkeletonCard = () => (
    <div className="p-4 rounded-xl border border-border bg-surface/30 animate-pulse">
      <div className="h-3 w-24 bg-border rounded mb-4"></div>
      <div className="h-2 w-full bg-border/50 rounded mb-2"></div>
      <div className="h-2 w-4/5 bg-border/50 rounded"></div>
    </div>
  );

  return (
    <div className="w-full max-w-5xl mx-auto bg-bg border border-border rounded-2xl overflow-hidden flex flex-col md:flex-row shadow-2xl h-200 md:h-150 outline-none">
      
      {/* Custom Sleek Scrollbar CSS */}
      <style>{`
        .custom-scroll::-webkit-scrollbar { width: 6px; }
        .custom-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-scroll::-webkit-scrollbar-thumb { background-color: transparent; border-radius: 10px; }
        .custom-scroll:hover::-webkit-scrollbar-thumb { background-color: var(--color-border); }
      `}</style>

      {/* Left Col - Chat */}
      <div className="w-full md:w-1/2 flex flex-col h-100 md:h-full border-b md:border-b-0 md:border-r border-border bg-surface/10">
        <div className="p-4 border-b border-border flex items-center gap-2 shrink-0">
          <Bot className="w-5 h-5 text-accent" />
          <h3 className="font-semibold text-text">AI Strategist</h3>
        </div>
        
        {/* Added custom-scroll and data-lenis-prevent */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 outline-none custom-scroll" aria-live="polite" data-lenis-prevent="true">
          {displayMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted animate-in fade-in">
              <Sparkles className="w-8 h-8 mb-3 opacity-50 text-accent" />
              <p>Describe your app idea, and I'll generate a technical blueprint.</p>
            </div>
          ) : (
            displayMessages.map(m => (
              <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {/* whitespace-pre-wrap added to fix line breaks! */}
                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap leading-relaxed ${m.role === 'user' ? 'bg-accent text-accent-fg' : 'bg-surface border border-border text-text shadow-sm'}`}>
                  {m.displayContent}
                </div>
              </div>
            ))
          )}
          
          {isLoading && !blueprint && (
            <div className="flex justify-start">
              <div className="bg-surface border border-border text-text rounded-2xl px-4 py-2.5 flex items-center gap-2 shadow-sm">
                <Loader2 className="w-4 h-4 animate-spin text-accent" />
                <span className="text-sm">Analyzing requirements...</span>
              </div>
            </div>
          )}

          {/* Clearer Chat Error bubble */}
          {error && (
            <div className="flex justify-start">
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl px-4 py-2.5 flex items-start gap-2 text-sm shadow-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <p>Connection failed or rate limit reached. Please wait a moment and try again.</p>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input Form */}
        <div className="p-4 bg-bg border-t border-border shrink-0">
          <form onSubmit={onSubmit} className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="E.g., I want to build a gents store website..."
              disabled={!!blueprint || isLoading}
              className="w-full bg-surface border border-border text-text rounded-full px-5 py-3.5 pr-12 text-sm focus:outline-none focus-visible:ring-1 focus-visible:ring-accent disabled:opacity-50 transition-all"
            />
            <button
              type="submit"
              disabled={!input.trim() || !!blueprint || isLoading}
              className="absolute right-2 p-2.5 rounded-full bg-accent text-accent-fg hover:scale-105 disabled:opacity-50 transition-transform cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Right Col - Flex Col Layout (Prevents Sticky Footer Overlap) */}
      <div className="w-full md:w-1/2 flex flex-col h-100 md:h-full bg-bg outline-none">
        
        <div className="flex-1 overflow-y-auto outline-none custom-scroll" data-lenis-prevent="true">
          
          {/* Empty State */}
          {!blueprint && !isLoading && !error && (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-muted animate-in fade-in">
              <div className="w-16 h-16 rounded-full border border-dashed border-border flex items-center justify-center mb-4 bg-surface/50">
                <Sparkles className="w-6 h-6 opacity-30" />
              </div>
              <p className="text-sm">Your technical blueprint will appear here once we clarify your requirements.</p>
            </div>
          )}

          {/* Major Error State for Blueprint Panel */}
          {error && !blueprint && (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-red-500 animate-in fade-in">
              <div className="w-16 h-16 rounded-full border border-dashed border-red-500/30 flex items-center justify-center mb-4 bg-red-500/10">
                <AlertCircle className="w-6 h-6 opacity-80" />
              </div>
              <h3 className="text-lg font-semibold text-text mb-2">AI is currently busy</h3>
              <p className="text-sm text-muted">We've hit our API limit or lost connection. Please wait a moment and try again.</p>
            </div>
          )}

          {/* Skeleton Loader */}
          {!blueprint && isLoading && displayMessages.length > 2 && !error && (
            <div className="p-6 md:p-8 flex flex-col gap-6 w-full">
              <div>
                <div className="h-6 w-48 bg-surface rounded animate-pulse mb-2"></div>
                <div className="h-3 w-32 bg-surface rounded animate-pulse"></div>
              </div>
              <div className="space-y-4">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </div>
            </div>
          )}

          {/* Completed Blueprint */}
          {blueprint && (
            <div className="p-6 md:p-8 flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-8">
              <div>
                <h2 className="text-2xl font-bold text-text mb-2">Project Blueprint</h2>
                <p className="text-sm text-muted">Generated by Tencio AI</p>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-border bg-surface/30 hover:border-accent/50 transition-colors">
                  <h3 className="text-xs font-mono text-accent uppercase tracking-wider mb-2">Architecture</h3>
                  <p className="text-sm text-text leading-relaxed">{blueprint.architecture}</p>
                </div>
                
                <div className="p-4 rounded-xl border border-border bg-surface/30 hover:border-accent/50 transition-colors">
                  <h3 className="text-xs font-mono text-accent uppercase tracking-wider mb-2">MVP Scope</h3>
                  <p className="text-sm text-text whitespace-pre-line leading-relaxed">{blueprint.scope}</p>
                </div>
                
                <div className="p-4 rounded-xl border border-border bg-surface/30 hover:border-accent/50 transition-colors">
                  <h3 className="text-xs font-mono text-accent uppercase tracking-wider mb-2">Timeline</h3>
                  <p className="text-sm text-text leading-relaxed">{blueprint.timeline}</p>
                </div>

                <div className="p-4 rounded-xl border border-border bg-surface/30 hover:border-accent/50 transition-colors">
                  <h3 className="text-xs font-mono text-accent uppercase tracking-wider mb-2">Next Steps</h3>
                  <p className="text-sm text-text whitespace-pre-line leading-relaxed">{blueprint.next_steps}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sticky CTA Footer - shrink-0 ensures it never covers content */}
        {blueprint && (
          <div className="w-full bg-bg/95 backdrop-blur-md border-t border-border p-4 md:p-6 shrink-0 z-20 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
            {!showLeadForm ? (
              <button
                onClick={() => setShowLeadForm(true)}
                className="w-full py-3.5 rounded-md bg-accent text-accent-fg font-medium hover:scale-[1.02] transition-transform cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
              >
                Send me the full proposal &rarr;
              </button>
            ) : leadStatus === 'success' ? (
              <div className="p-4 rounded-md border border-accent bg-accent/10 flex items-center gap-3 text-text">
                <CheckCircle2 className="w-5 h-5 text-accent" />
                <p className="text-sm font-medium">Proposal sent! We'll be in touch shortly.</p>
              </div>
            ) : (
              <form onSubmit={handleLeadSubmit} className="flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex gap-3">
                  <input
                    id="name"
                    name="name"
                    value={leadForm.name}
                    onChange={(e) => setLeadForm({...leadForm, name: e.target.value})}
                    required
                    placeholder="Your Name"
                    className="w-1/2 bg-surface border border-border text-text rounded-md px-4 py-2.5 text-sm focus:outline-none focus-visible:ring-1 focus-visible:ring-accent"
                  />
                  <input
                    id="contact"
                    name="contact"
                    value={leadForm.contact}
                    onChange={(e) => setLeadForm({...leadForm, contact: e.target.value})}
                    required
                    placeholder="Email or Phone"
                    className="w-1/2 bg-surface border border-border text-text rounded-md px-4 py-2.5 text-sm focus:outline-none focus-visible:ring-1 focus-visible:ring-accent"
                  />
                </div>
                <button
                  type="submit"
                  disabled={leadStatus === 'loading'}
                  className="w-full py-2.5 rounded-md bg-text text-bg font-medium text-sm hover:opacity-90 disabled:opacity-50 flex justify-center items-center gap-2 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  {leadStatus === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}