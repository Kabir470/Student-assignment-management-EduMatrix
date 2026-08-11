'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Sparkles, Send, Bot, User, Check, Edit2, RotateCw, Maximize2, Minimize2 } from 'lucide-react';
import type { AssignmentCreateInput, Course } from '@/lib/types';
import RichTextEditor from '@/components/ui/RichTextEditor';

interface AiAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApprove: (data: Partial<AssignmentCreateInput>) => void;
  courses: Course[];
}

type MessageRole = 'user' | 'ai';

interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  isDraft?: boolean;
  draftData?: Partial<AssignmentCreateInput>;
}

export default function AiAssignmentModal({ isOpen, onClose, onApprove, courses }: AiAssignmentModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [expandedEditorId, setExpandedEditorId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize with a welcome message when opened
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          role: 'ai',
          content: 'Hi there! 👋 I am your AI Assistant. What kind of assignment would you like to create today? You can just describe it naturally (e.g. "Create a 50-mark math quiz for next Friday").',
        }
      ]);
    }
  }, [isOpen, messages.length]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  if (!isOpen) return null;

  // Handle fake AI responses for the UI preview phase
  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputValue('');
    setIsTyping(true);

    try {
      const response = await fetch('/api/ai/generate-assignment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate response');
      }

      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'ai',
        content: data.chatResponse || 'Here is the drafted assignment:',
        isDraft: data.isDraft,
        draftData: data.draftData
      }]);
    } catch (error: any) {
      console.error(error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'ai',
        content: `Error: ${error.message}. Please check your API key and try again.`,
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const updateDraftData = (messageId: string, updates: Partial<AssignmentCreateInput>) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId && msg.draftData) {
        return { ...msg, draftData: { ...msg.draftData, ...updates } };
      }
      return msg;
    }));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem'
    }}>
      {/* Backdrop */}
      <div 
        onClick={onClose}
        style={{
          position: 'absolute', inset: 0,
          background: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(8px)',
          animation: 'fadeIn 0.2s ease-out'
        }}
      />

      {/* Modal Container */}
      <div style={{
        position: 'relative',
        width: '100%', maxWidth: '800px', height: '85vh',
        background: 'var(--color-surface)',
        borderRadius: '24px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255,255,255,0.1) inset',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(168, 85, 247, 0.05) 100%)',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ 
              width: 36, height: 36, borderRadius: '10px', 
              background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
            }}>
              <Sparkles size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text)', margin: 0, letterSpacing: '-0.02em' }}>
                AI Assignment Generator <span style={{ fontSize: '0.7rem', padding: '2px 6px', background: 'rgba(168, 85, 247, 0.1)', color: '#9333ea', borderRadius: '4px', verticalAlign: 'middle', marginLeft: '6px' }}>BETA</span>
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: 0 }}>Powered by Gemini Pro</p>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-icon" style={{ color: 'var(--color-text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Chat Area */}
        <div style={{
          flex: 1, overflowY: 'auto', padding: '1.5rem',
          display: 'flex', flexDirection: 'column', gap: '1.5rem',
          background: 'var(--color-surface-2)'
        }}>
          {messages.map((msg) => (
            <div key={msg.id} style={{
              display: 'flex', 
              flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
              gap: '1rem',
              alignItems: 'flex-start'
            }}>
              {/* Avatar */}
              <div style={{
                width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: msg.role === 'ai' ? 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)' : '#e2e8f0',
                color: msg.role === 'ai' ? 'white' : 'var(--color-text-secondary)',
              }}>
                {msg.role === 'ai' ? <Bot size={18} /> : <User size={18} />}
              </div>

              {/* Message Bubble */}
              <div style={{
                maxWidth: '75%',
                display: 'flex', flexDirection: 'column', gap: '0.75rem'
              }}>
                <div style={{
                  padding: '0.85rem 1.25rem',
                  borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  background: msg.role === 'user' ? '#4f46e5' : 'var(--color-surface)',
                  color: msg.role === 'user' ? 'white' : 'var(--color-text)',
                  border: msg.role === 'ai' ? '1px solid var(--color-border)' : 'none',
                  fontSize: '0.95rem',
                  lineHeight: 1.5,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                }}>
                  {msg.content}
                </div>

                {/* Draft Card Presentation */}
                {msg.isDraft && msg.draftData && (
                  <div style={{
                    background: 'var(--color-surface)',
                    border: '1px solid rgba(168, 85, 247, 0.3)',
                    borderRadius: '16px',
                    padding: '1.5rem',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.04), 0 0 0 1px rgba(168, 85, 247, 0.05) inset',
                    animation: 'fadeInUp 0.4s ease-out'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#9333ea', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        <Sparkles size={14} /> AI Generated Draft
                      </div>
                      {expandedEditorId !== msg.id && (
                        <button 
                          onClick={() => setExpandedEditorId(msg.id)}
                          className="btn btn-secondary btn-sm"
                          style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', fontSize: '0.8rem', padding: '0.25rem 0.75rem' }}
                        >
                          <Maximize2 size={14}/> Expand
                        </button>
                      )}
                    </div>
                    
                    <input 
                      type="text" 
                      value={msg.draftData.title || ''}
                      onChange={(e) => updateDraftData(msg.id, { title: e.target.value })}
                      style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: 'var(--color-text)', background: 'transparent', border: '1px dashed transparent', outline: 'none', width: '100%', padding: '2px 4px', borderRadius: '4px', transition: 'border 0.2s' }}
                      onFocus={(e) => e.target.style.border = '1px dashed var(--color-border)'}
                      onBlur={(e) => e.target.style.border = '1px dashed transparent'}
                    />
                    
                    <div style={
                      expandedEditorId === msg.id 
                      ? { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10000, background: 'var(--color-background)', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto' } 
                      : { marginBottom: '1.5rem', marginTop: '0.5rem', position: 'relative' }
                    }>
                      {expandedEditorId === msg.id && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <h2 style={{margin: 0, color: 'var(--color-text)'}}>Edit Assignment Description</h2>
                          <button 
                            onClick={() => setExpandedEditorId(null)}
                            className="btn btn-secondary"
                            style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}
                          >
                            <Minimize2 size={16}/> Collapse
                          </button>
                        </div>
                      )}
                      <RichTextEditor 
                        value={msg.draftData.description || ''}
                        onChange={(val) => updateDraftData(msg.id, { description: val })}
                        expanded={expandedEditorId === msg.id}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                      <div style={{ background: 'var(--color-surface-2)', padding: '0.75rem', borderRadius: '8px', border: '1px solid transparent', transition: 'border 0.2s' }} className="focus-within:border-indigo-500">
                        <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', margin: '0 0 0.25rem 0' }}>Course</p>
                        <select
                          value={msg.draftData.courseId || ''}
                          onChange={(e) => updateDraftData(msg.id, { courseId: e.target.value })}
                          style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text)', margin: 0, background: 'transparent', border: 'none', outline: 'none', width: '100%' }}
                        >
                          <option value="">Select Course...</option>
                          {courses?.map(course => (
                            <option key={course.id} value={course.id}>{course.title}</option>
                          ))}
                        </select>
                      </div>
                      <div style={{ background: 'var(--color-surface-2)', padding: '0.75rem', borderRadius: '8px', border: '1px solid transparent', transition: 'border 0.2s' }} className="focus-within:border-indigo-500">
                        <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', margin: '0 0 0.25rem 0' }}>Marks</p>
                        <input 
                          type="number" 
                          value={msg.draftData.totalMarks || ''}
                          onChange={(e) => updateDraftData(msg.id, { totalMarks: Number(e.target.value) })}
                          style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text)', margin: 0, background: 'transparent', border: 'none', outline: 'none', width: '100%' }}
                        />
                      </div>
                      <div style={{ background: 'var(--color-surface-2)', padding: '0.75rem', borderRadius: '8px', border: '1px solid transparent', transition: 'border 0.2s' }} className="focus-within:border-indigo-500">
                        <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', margin: '0 0 0.25rem 0' }}>Due Date</p>
                        <input 
                          type="date"
                          value={msg.draftData.dueDate ? new Date(msg.draftData.dueDate).toISOString().split('T')[0] : ''}
                          onChange={(e) => updateDraftData(msg.id, { dueDate: new Date(e.target.value).toISOString() })}
                          style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text)', margin: 0, background: 'transparent', border: 'none', outline: 'none', width: '100%' }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <button 
                        onClick={() => onApprove(msg.draftData!)}
                        className="btn btn-primary" 
                        style={{ flex: 1, background: '#10b981', display: 'flex', justifyContent: 'center', gap: '0.5rem', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)' }}
                      >
                        <Check size={16} /> Approve & Fill Form
                      </button>
                      <button className="btn btn-outline" style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                        <RotateCw size={16} /> Regenerate
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isTyping && (
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
               <div style={{
                width: 32, height: 32, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', color: 'white',
              }}>
                <Bot size={18} />
              </div>
              <div style={{ display: 'flex', gap: '4px', padding: '1rem', background: 'var(--color-surface)', borderRadius: '18px', border: '1px solid var(--color-border)' }}>
                <span className="typing-dot" style={{ animationDelay: '0s' }}></span>
                <span className="typing-dot" style={{ animationDelay: '0.2s' }}></span>
                <span className="typing-dot" style={{ animationDelay: '0.4s' }}></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div style={{
          padding: '1.25rem 1.5rem',
          background: 'var(--color-surface)',
          borderTop: '1px solid var(--color-border)',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            background: 'var(--color-surface-2)',
            borderRadius: '24px',
            padding: '0.5rem',
            border: '1px solid var(--color-border)',
            transition: 'border-color 0.2s, box-shadow 0.2s',
          }} className="ai-input-wrapper">
            <textarea
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe the assignment you want to create..."
              style={{
                flex: 1, background: 'transparent', border: 'none', outline: 'none',
                padding: '0.5rem 1rem', resize: 'none', height: '40px',
                fontSize: '0.95rem', color: 'var(--color-text)',
                fontFamily: 'inherit',
              }}
            />
            <button 
              onClick={handleSend}
              disabled={!inputValue.trim() || isTyping}
              style={{
                width: 40, height: 40, borderRadius: '50%',
                background: inputValue.trim() && !isTyping ? '#4f46e5' : 'var(--color-surface-3)',
                color: inputValue.trim() && !isTyping ? 'white' : 'var(--color-text-muted)',
                border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: inputValue.trim() && !isTyping ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s'
              }}
            >
              <Send size={18} style={{ transform: 'translateX(1px)' }} />
            </button>
          </div>
          <p style={{ textAlign: 'center', fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '0.75rem', marginBottom: 0 }}>
            AI can make mistakes. Always review generated assignments before publishing.
          </p>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .ai-input-wrapper:focus-within {
          border-color: #6366f1 !important;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1) !important;
        }
        .typing-dot {
          width: 6px; height: 6px; background: var(--color-text-muted); border-radius: 50%;
          animation: bounce 1.4s infinite ease-in-out both;
        }
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }
      `}} />
    </div>
  );
}
