import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import {
  Send,
  Loader2,
  Sparkles,
  CheckCircle2,
  Bot,
  AlertCircle,
  User,
  RefreshCw,
  Cpu,
  Layers,
  Calendar,
  ArrowRight,
  CornerDownLeft,
  Copy,
  Check
} from 'lucide-react';

const SUGGESTIONS = [
  "E-commerce store with WhatsApp checkout for local retail",
  "Luxury gent's styling boutique with appointment booking",
  "Modern web application with customer portal & analytics"
];

export default function BlueprintGenerator() {
  const [input, setInput] = useState('');
  const [copied, setCopied] = useState(false);

  const { messages, sendMessage, status, error, setMessages, regenerate } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/blueprint',
    }),
    onError: (err) => console.error("Chat Error:", err)
  });

  const isLoading = status === 'submitted' || status === 'streaming';
  const [blueprint, setBlueprint] = useState<any>(null);
  
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadStatus, setLeadStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const [leadForm, setLeadForm] = useState({ name: '', contact: '' });
  
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // SMART AUTO-SCROLL: Only scrolls if the user is already near the bottom
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;
    
    const isNearBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 120;
    
    if (isNearBottom) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, isLoading]);

  // AUTO-EXPAND TEXTAREA AS USER TYPES
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.min(textareaRef.current.scrollHeight, 140);
      textareaRef.current.style.height = `${Math.max(newHeight, 44)}px`;
    }
  }, [input]);

  // DYNAMIC CONTEXTUAL PLACEHOLDER
  const getDynamicPlaceholder = () => {
    if (blueprint) return "Blueprint generated! Review your technical architecture...";
    if (isLoading) return "Analyzing requirements & calculating feasibility...";
    if (messages.length > 0) return "Type your answer here (Shift + Enter for new line)...";
    return "Describe your digital product idea (e.g., luxury boutique with online ordering)...";
  };

  // ROBUST BLUEPRINT PARSER
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
          if (parsed && (parsed.architecture || parsed.scope)) {
            setBlueprint(parsed);
          }
        } catch (e) {
          console.error("Failed to parse blueprint JSON:", e);
        }
      }
    }
  }, [messages]);

  // HANDLE FORM SUBMISSION
  const handleSend = () => {
    if (!input.trim() || !!blueprint || isLoading) return;
    sendMessage({ text: input.trim() });
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = '44px';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSelectSuggestion = (suggestion: string) => {
    if (isLoading || !!blueprint) return;
    sendMessage({ text: suggestion });
  };

  const handleRetry = () => {
    if (regenerate) {
      regenerate();
    }
  };

  const handleReset = () => {
    setBlueprint(null);
    setMessages([]);
    setInput('');
    setShowLeadForm(false);
  };

  const handleCopyBlueprint = () => {
    if (!blueprint) return;
    const text = `TENCIO PROJECT BLUEPRINT
-----------------------------------------
ARCHITECTURE:
${blueprint.architecture || ''}

MVP SCOPE:
${Array.isArray(blueprint.scope) ? blueprint.scope.map((s: string) => `• ${s}`).join('\n') : blueprint.scope || ''}

TIMELINE:
${blueprint.timeline || ''}

NEXT STEPS:
${Array.isArray(blueprint.next_steps) ? blueprint.next_steps.map((s: string, i: number) => `${i + 1}. ${s}`).join('\n') : blueprint.next_steps || ''}
`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // HANDLE LEAD SUBMISSION & RESET
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
        setLeadForm({ name: '', contact: '' });
        
        setTimeout(() => {
          setShowLeadForm(false);
          setLeadStatus('idle');
          setBlueprint(null);
          setMessages([]); 
        }, 3000);
      } else {
        setLeadStatus('idle');
      }
    } catch {
      setLeadStatus('idle');
    }
  };

  // STRIP JSON PAYLOAD FROM VISIBLE CHAT
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
      <div className="h-3 w-28 bg-border rounded mb-4"></div>
      <div className="h-2.5 w-full bg-border/50 rounded mb-2"></div>
      <div className="h-2.5 w-4/5 bg-border/50 rounded"></div>
    </div>
  );

  return (
    <div className="w-full max-w-5xl mx-auto bg-bg border border-border rounded-2xl overflow-hidden flex flex-col md:flex-row shadow-2xl h-auto md:h-[620px] outline-none">
      
      {/* SAFE CUSTOM SCROLLBARS */}
      <style>{`
        .ai-scroll::-webkit-scrollbar { width: 6px; }
        .ai-scroll::-webkit-scrollbar-track { background: transparent; }
        .ai-scroll::-webkit-scrollbar-thumb { background-color: rgba(150,150,150,0.2); border-radius: 10px; }
        .ai-scroll:hover::-webkit-scrollbar-thumb { background-color: rgba(150,150,150,0.4); }
      `}</style>

      {/* LEFT COLUMN - CHAT INTERFACE */}
      <div className="w-full md:w-1/2 flex flex-col h-[520px] md:h-full border-b md:border-b-0 md:border-r border-border bg-surface/10">
        
        {/* CHAT HEADER */}
        <div className="p-4 border-b border-border flex items-center justify-between shrink-0 bg-bg z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center text-accent">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-text text-sm">AI Product Strategist</h3>
              <p className="text-[11px] text-muted flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"></span>
                <span>Active • Instant Technical Blueprint</span>
              </p>
            </div>
          </div>
          {displayMessages.length > 0 && !blueprint && (
            <button
              onClick={handleReset}
              className="text-xs text-muted hover:text-text px-2 py-1 rounded hover:bg-surface transition-colors cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
        
        {/* CHAT SCROLL AREA */}
        <div 
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 outline-none ai-scroll" 
          aria-live="polite" 
          data-lenis-prevent="true"
        >
          {displayMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-4 text-muted animate-in fade-in">
              <div className="w-12 h-12 rounded-2xl bg-surface border border-border flex items-center justify-center mb-3 text-accent shadow-xs">
                <Sparkles className="w-6 h-6" />
              </div>
              <h4 className="text-text font-medium text-sm mb-1">What are you looking to build?</h4>
              <p className="text-xs max-w-xs mb-6 text-muted">
                Describe your business or product idea. We'll ask 3 quick questions to map out your architecture and scope.
              </p>

              {/* QUICK PROMPT SUGGESTIONS */}
              <div className="w-full flex flex-col gap-2">
                <p className="text-[11px] font-mono uppercase tracking-wider text-muted text-left mb-1">Suggested Ideas:</p>
                {SUGGESTIONS.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectSuggestion(s)}
                    className="text-left text-xs p-2.5 rounded-xl border border-border/80 bg-surface/40 hover:bg-surface hover:border-accent/40 text-text transition-all cursor-pointer flex items-center justify-between group"
                  >
                    <span className="truncate pr-2">{s}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-muted group-hover:text-accent group-hover:translate-x-0.5 transition-all shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            displayMessages.map(m => (
              <div key={m.id} className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.role !== 'user' && (
                  <div className="w-7 h-7 rounded-full bg-surface border border-border flex items-center justify-center shrink-0 mt-0.5 text-accent shadow-xs">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}
                <div 
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap leading-relaxed shadow-xs ${
                    m.role === 'user' 
                      ? 'bg-accent text-accent-fg font-medium rounded-tr-xs' 
                      : 'bg-surface border border-border text-text rounded-tl-xs'
                  }`}
                >
                  {m.displayContent}
                </div>
                {m.role === 'user' && (
                  <div className="w-7 h-7 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center shrink-0 mt-0.5 text-accent shadow-xs">
                    <User className="w-3.5 h-3.5 text-text" />
                  </div>
                )}
              </div>
            ))
          )}
          
          {isLoading && !blueprint && (
            <div className="flex justify-start gap-2.5">
              <div className="w-7 h-7 rounded-full bg-surface border border-border flex items-center justify-center shrink-0 mt-0.5 text-accent">
                <Bot className="w-3.5 h-3.5" />
              </div>
              <div className="bg-surface border border-border text-text rounded-2xl rounded-tl-xs px-4 py-2.5 flex items-center gap-2 shadow-xs">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-accent" />
                <span className="text-xs text-muted">Analyzing architecture requirements...</span>
              </div>
            </div>
          )}

          {error && (
            <div className="flex justify-start gap-2.5">
              <div className="w-7 h-7 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center shrink-0 mt-0.5 text-red-500">
                <AlertCircle className="w-3.5 h-3.5" />
              </div>
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl rounded-tl-xs px-4 py-3 text-xs shadow-xs flex flex-col gap-2">
                <p>Connection interrupted or rate limit reached.</p>
                <button
                  type="button"
                  onClick={handleRetry}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-text bg-surface hover:bg-surface/80 border border-border px-3 py-1.5 rounded-lg w-fit transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3 text-accent" />
                  <span>Retry Message</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* MULTI-LINE INPUT AREA */}
        <div className="p-3 bg-bg border-t border-border shrink-0 z-10">
          <div className="relative flex flex-col bg-surface border border-border rounded-2xl focus-within:border-accent/80 focus-within:ring-1 focus-within:ring-accent/80 transition-all p-2">
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={getDynamicPlaceholder()}
              disabled={!!blueprint || isLoading}
              className="w-full bg-transparent text-text placeholder:text-muted/70 px-2 py-1 text-sm resize-none focus:outline-none disabled:opacity-50 ai-scroll min-h-[44px] max-h-[140px] leading-relaxed"
            />
            
            <div className="flex items-center justify-between pt-1 px-1 border-t border-border/40 mt-1">
              <span className="text-[10px] text-muted hidden sm:inline-flex items-center gap-1">
                <span>Press</span>
                <kbd className="px-1 py-0.5 rounded bg-bg border border-border text-[9px] font-mono">↵ Enter</kbd>
                <span>to send</span>
                <span className="text-muted/60">•</span>
                <kbd className="px-1 py-0.5 rounded bg-bg border border-border text-[9px] font-mono">Shift + ↵</kbd>
                <span>new line</span>
              </span>
              <span className="sm:hidden"></span>

              <button
                type="button"
                onClick={handleSend}
                disabled={!input.trim() || !!blueprint || isLoading}
                aria-label="Send message"
                className="p-2 rounded-xl bg-accent text-accent-fg hover:scale-105 disabled:opacity-30 disabled:hover:scale-100 transition-all cursor-pointer focus:outline-none"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN - BLUEPRINT RESULTS */}
      <div className="w-full md:w-1/2 flex flex-col h-[520px] md:h-full bg-bg outline-none">
        
        <div 
          className="flex-1 overflow-y-auto outline-none ai-scroll p-6 md:p-7"
          data-lenis-prevent="true"
        >
          {!blueprint && !isLoading && !error && (
            <div className="h-full flex flex-col items-center justify-center text-center text-muted animate-in fade-in">
              <div className="w-16 h-16 rounded-2xl border border-dashed border-border flex items-center justify-center mb-4 bg-surface/50 text-accent">
                <Sparkles className="w-7 h-7 opacity-40" />
              </div>
              <h3 className="text-sm font-semibold text-text mb-1">Interactive Technical Blueprint</h3>
              <p className="text-xs text-muted max-w-xs leading-relaxed">
                Your tailored architecture, Phase 1 MVP features, timeline, and execution steps will appear here in real time.
              </p>
            </div>
          )}

          {error && !blueprint && (
            <div className="h-full flex flex-col items-center justify-center text-center text-red-500 animate-in fade-in p-4">
              <div className="w-14 h-14 rounded-2xl border border-dashed border-red-500/30 flex items-center justify-center mb-3 bg-red-500/10">
                <AlertCircle className="w-6 h-6 opacity-80" />
              </div>
              <h3 className="text-base font-semibold text-text mb-1">Connection Interrupted</h3>
              <p className="text-xs text-muted max-w-xs mb-4">
                The AI service hit a rate limit or lost connection. You can retry immediately.
              </p>
              <button
                type="button"
                onClick={handleRetry}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-surface border border-border text-text hover:border-accent text-xs font-medium transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-accent" />
                <span>Retry Now</span>
              </button>
            </div>
          )}

          {!blueprint && isLoading && displayMessages.length > 2 && !error && (
            <div className="flex flex-col gap-5 w-full">
              <div>
                <div className="h-6 w-44 bg-surface rounded animate-pulse mb-2"></div>
                <div className="h-3 w-32 bg-surface rounded animate-pulse"></div>
              </div>
              <div className="space-y-3.5">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </div>
            </div>
          )}

          {blueprint && (
            <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-2">
              
              {/* BLUEPRINT TOP BAR */}
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-accent/15 text-text border border-accent/30 mb-1">
                    <Sparkles className="w-3 h-3 text-accent" />
                    <span>Technical Blueprint</span>
                  </div>
                  <h2 className="text-xl font-bold text-text">Project Architecture</h2>
                </div>
                
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleCopyBlueprint}
                    className="px-2.5 py-1.5 rounded-lg border border-border hover:bg-surface text-muted hover:text-text transition-colors cursor-pointer text-xs flex items-center gap-1.5"
                    title="Copy Blueprint"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-accent" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                  <button
                    onClick={handleReset}
                    className="p-1.5 rounded-lg border border-border hover:bg-surface text-muted hover:text-text transition-colors cursor-pointer text-xs flex items-center gap-1"
                    title="Start New Blueprint"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* STRUCTURED BLUEPRINT CARDS */}
              <div className="space-y-3.5">
                
                {/* ARCHITECTURE CARD */}
                <div className="p-4 rounded-xl border border-border bg-surface/30 hover:border-accent/50 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <Cpu className="w-4 h-4 text-accent" />
                    <h3 className="text-xs font-mono text-accent uppercase tracking-wider font-semibold">Recommended Tech Stack</h3>
                  </div>
                  <p className="text-sm text-text leading-relaxed font-normal">{blueprint.architecture}</p>
                </div>
                
                {/* MVP SCOPE CARD (HANDLES ARRAY AND STRING) */}
                <div className="p-4 rounded-xl border border-border bg-surface/30 hover:border-accent/50 transition-colors">
                  <div className="flex items-center gap-2 mb-3">
                    <Layers className="w-4 h-4 text-accent" />
                    <h3 className="text-xs font-mono text-accent uppercase tracking-wider font-semibold">Phase 1 MVP Scope</h3>
                  </div>
                  {Array.isArray(blueprint.scope) ? (
                    <ul className="space-y-2">
                      {blueprint.scope.map((item: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2.5 text-sm text-text leading-relaxed">
                          <CheckCircle2 className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-text whitespace-pre-line leading-relaxed">{blueprint.scope}</p>
                  )}
                </div>
                
                {/* TIMELINE CARD */}
                <div className="p-4 rounded-xl border border-border bg-surface/30 hover:border-accent/50 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-accent" />
                    <h3 className="text-xs font-mono text-accent uppercase tracking-wider font-semibold">Timeline & Milestones</h3>
                  </div>
                  <p className="text-sm text-text leading-relaxed">{blueprint.timeline}</p>
                </div>

                {/* NEXT STEPS CARD (HANDLES ARRAY AND STRING) */}
                <div className="p-4 rounded-xl border border-border bg-surface/30 hover:border-accent/50 transition-colors">
                  <div className="flex items-center gap-2 mb-3">
                    <ArrowRight className="w-4 h-4 text-accent" />
                    <h3 className="text-xs font-mono text-accent uppercase tracking-wider font-semibold">Immediate Next Steps</h3>
                  </div>
                  {Array.isArray(blueprint.next_steps) ? (
                    <ol className="space-y-2">
                      {blueprint.next_steps.map((step: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2.5 text-sm text-text leading-relaxed">
                          <span className="w-5 h-5 rounded-full bg-accent/15 border border-accent/30 text-accent font-mono text-xs flex items-center justify-center shrink-0 mt-0.5 font-bold">
                            {idx + 1}
                          </span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="text-sm text-text whitespace-pre-line leading-relaxed">{blueprint.next_steps}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* CTA FOOTER */}
        {blueprint && (
          <div className="w-full bg-bg/95 backdrop-blur-md border-t border-border p-4 shrink-0 z-20 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
            {!showLeadForm ? (
              <button
                onClick={() => setShowLeadForm(true)}
                className="w-full py-3 rounded-xl bg-accent text-accent-fg font-semibold text-sm hover:scale-[1.01] transition-transform cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                Send me the full proposal &rarr;
              </button>
            ) : leadStatus === 'success' ? (
              <div className="p-3.5 rounded-xl border border-accent bg-accent/10 flex items-center gap-3 text-text">
                <CheckCircle2 className="w-5 h-5 text-accent shrink-0" />
                <p className="text-xs font-medium">Proposal request submitted! Our lead engineer will connect with you shortly.</p>
              </div>
            ) : (
              <form onSubmit={handleLeadSubmit} className="flex flex-col gap-2.5 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex gap-2">
                  <input
                    id="name"
                    name="name"
                    value={leadForm.name}
                    onChange={(e) => setLeadForm({...leadForm, name: e.target.value})}
                    required
                    placeholder="Your Name"
                    className="w-1/2 bg-surface border border-border text-text rounded-xl px-3.5 py-2 text-xs focus:outline-none focus-visible:ring-1 focus-visible:ring-accent"
                  />
                  <input
                    id="contact"
                    name="contact"
                    value={leadForm.contact}
                    onChange={(e) => setLeadForm({...leadForm, contact: e.target.value})}
                    required
                    placeholder="Email or WhatsApp"
                    className="w-1/2 bg-surface border border-border text-text rounded-xl px-3.5 py-2 text-xs focus:outline-none focus-visible:ring-1 focus-visible:ring-accent"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowLeadForm(false)}
                    className="px-3 py-2 rounded-xl border border-border text-muted hover:text-text text-xs transition-colors cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={leadStatus === 'loading'}
                    className="flex-1 py-2 rounded-xl bg-accent text-accent-fg font-semibold text-xs hover:opacity-90 disabled:opacity-50 flex justify-center items-center gap-1.5 cursor-pointer"
                  >
                    {leadStatus === 'loading' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Confirm & Request Proposal'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
      
    </div>
  );
}