'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { X, Send, ArrowLeft, Search, User, MessageSquare } from 'lucide-react';
import api from '@/lib/api';

interface Contact {
  id: string;
  name: string;
  role: string;
  info: string;
}

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
}

export default function ChatDrawer({ isOpen, onClose, currentUserId }: ChatDrawerProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch allowed contacts
  const fetchContacts = useCallback(async () => {
    if (!isOpen) return;
    setLoadingContacts(true);
    try {
      const res = await api.get('/messages/users');
      setContacts(res.data.data || []);
      setFilteredContacts(res.data.data || []);
    } catch (error) {
      console.warn('Failed to load chat contacts:', error);
    } finally {
      setLoadingContacts(false);
    }
  }, [isOpen]);

  // Fetch message history with a specific contact
  const fetchMessages = useCallback(async (contactId: string, silent = false) => {
    if (!contactId) return;
    if (!silent) setLoadingMessages(true);
    try {
      const res = await api.get(`/messages/history/${contactId}`);
      setMessages(res.data.data || []);
    } catch (error) {
      console.warn('Failed to fetch message history:', error);
    } finally {
      if (!silent) setLoadingMessages(false);
    }
  }, []);

  // Poll conversation history
  useEffect(() => {
    if (!isOpen) return;
    fetchContacts();
  }, [isOpen, fetchContacts]);

  useEffect(() => {
    if (!isOpen || !selectedContact) return;
    
    fetchMessages(selectedContact.id);
    
    // Poll for new messages every 4 seconds
    const interval = setInterval(() => {
      fetchMessages(selectedContact.id, true);
    }, 4000);

    return () => clearInterval(interval);
  }, [isOpen, selectedContact, fetchMessages]);

  // Filter contacts based on search query
  useEffect(() => {
    if (!searchQuery) {
      setFilteredContacts(contacts);
    } else {
      const q = searchQuery.toLowerCase();
      setFilteredContacts(
        contacts.filter(
          c =>
            c.name.toLowerCase().includes(q) ||
            c.role.toLowerCase().includes(q) ||
            c.info.toLowerCase().includes(q)
        )
      );
    }
  }, [searchQuery, contacts]);

  // Scroll to bottom helper
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message handler
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContact || !newMessage.trim() || sending) return;

    setSending(true);
    try {
      const res = await api.post('/messages/send', {
        recipient_id: selectedContact.id,
        content: newMessage.trim()
      });
      if (res.data.success) {
        setMessages(prev => [...prev, res.data.data]);
        setNewMessage('');
      }
    } catch (error) {
      console.warn('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(26, 29, 59, 0.4)',
          backdropFilter: 'blur(4px)',
          zIndex: 100,
          animation: 'fadeIn 0.25s cubic-bezier(0.4, 0, 0.2, 1) forwards'
        }}
      />

      {/* Slideout Panel */}
      <div
        style={{
          position: 'fixed',
          top: 0, right: 0, bottom: 0,
          width: '420px',
          background: 'rgba(255, 255, 255, 0.96)',
          backdropFilter: 'blur(20px)',
          boxShadow: '-10px 0 40px rgba(26, 29, 59, 0.15)',
          borderLeft: '1px solid rgba(238, 238, 245, 0.8)',
          zIndex: 101,
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
        }}
      >
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes slideIn {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
        `}} />

        {/* Drawer Header */}
        <div
          style={{
            padding: '24px',
            borderBottom: '1px solid #EEEEF5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#F8F9FD'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {selectedContact && (
              <button
                onClick={() => setSelectedContact(null)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: '4px', color: '#5E6278', display: 'flex', alignItems: 'center'
                }}
              >
                <ArrowLeft size={20} />
              </button>
            )}
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1A1D3B', margin: 0 }}>
              {selectedContact ? selectedContact.name : 'Direct Messages'}
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '4px', color: '#A1A5B7', transition: 'color 0.2s'
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#E53935'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#A1A5B7'; }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Selected Contact Subheader info */}
        {selectedContact && (
          <div style={{ padding: '10px 24px', background: '#FFF4E5', borderBottom: '1px solid #EEEEF5', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              fontSize: '10px', textTransform: 'uppercase', fontWeight: 800,
              color: '#E53935', background: 'rgba(229, 57, 53, 0.08)',
              padding: '2px 8px', borderRadius: '12px'
            }}>
              {selectedContact.role}
            </span>
            <span style={{ fontSize: '12px', color: '#5E6278', fontWeight: 500 }}>
              {selectedContact.info}
            </span>
          </div>
        )}

        {/* Body Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {!selectedContact ? (
            /* CONTACTS VIEW */
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              {/* Contact Search Input */}
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #EEEEF5' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', background: '#F4F5F9',
                  borderRadius: '50px', padding: '8px 16px', gap: '10px', border: '1px solid #EEEEF5'
                }}>
                  <Search size={16} color="#A1A5B7" />
                  <input
                    placeholder="Search contact or role..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    style={{
                      border: 'none', background: 'transparent', outline: 'none',
                      flex: 1, fontSize: '13px', color: '#1A1D3B'
                    }}
                  />
                </div>
              </div>

              {/* Contacts List container */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '10px 0' }}>
                {loadingContacts ? (
                  <div style={{ padding: '40px 20px', textAlign: 'center', color: '#A1A5B7' }}>
                    <div style={{ width: '20px', height: '20px', border: '2px solid rgba(229,57,53,0.25)', borderTopColor: '#E53935', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
                    <p style={{ fontSize: '14px', margin: 0 }}>Loading your contacts...</p>
                  </div>
                ) : filteredContacts.length > 0 ? (
                  filteredContacts.map(contact => (
                    <div
                      key={contact.id}
                      onClick={() => setSelectedContact(contact)}
                      style={{
                        padding: '16px 24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                        borderBottom: '1px solid #F8F9FD'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#F8F9FD'; }}
                      onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '40px', height: '40px', borderRadius: '50%',
                          background: 'linear-gradient(135deg, #FFF4E5 0%, #FFE0B2 100%)',
                          display: 'flex', alignItems: 'center', justifyItems: 'center',
                          justifyContent: 'center', color: '#F57C00'
                        }}>
                          <User size={20} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ fontSize: '14px', fontWeight: 700, color: '#1A1D3B' }}>
                            {contact.name}
                          </span>
                          <span style={{ fontSize: '12px', color: '#A1A5B7' }}>
                            {contact.info}
                          </span>
                        </div>
                      </div>

                      <span style={{
                        fontSize: '10px', textTransform: 'uppercase', fontWeight: 800,
                        color: contact.role === 'admin' ? '#10B981' : contact.role === 'teacher' ? '#3B82F6' : '#F59E0B',
                        background: contact.role === 'admin' ? 'rgba(16, 185, 129, 0.08)' : contact.role === 'teacher' ? 'rgba(59, 130, 246, 0.08)' : 'rgba(245, 158, 11, 0.08)',
                        padding: '2px 8px', borderRadius: '12px'
                      }}>
                        {contact.role}
                      </span>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '40px 20px', textAlign: 'center', color: '#A1A5B7' }}>
                    <MessageSquare size={24} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                    <p style={{ margin: 0, fontSize: '14px' }}>No contacts found.</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* CONVERSATION VIEW */
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', background: '#F4F5F9' }}>
              {/* Messages scroll box */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {loadingMessages ? (
                  <div style={{ padding: '40px 20px', textAlign: 'center', color: '#A1A5B7' }}>
                    <p style={{ fontSize: '13px', margin: 0 }}>Loading history...</p>
                  </div>
                ) : messages.length > 0 ? (
                  messages.map(msg => {
                    const isSender = msg.sender_id === currentUserId;
                    return (
                      <div
                        key={msg.id}
                        style={{
                          display: 'flex',
                          justifyContent: isSender ? 'flex-end' : 'flex-start',
                          width: '100%'
                        }}
                      >
                        <div
                          style={{
                            maxWidth: '75%',
                            padding: '12px 16px',
                            borderRadius: isSender ? '16px 16px 0 16px' : '16px 16px 16px 0',
                            background: isSender ? 'linear-gradient(135deg, #E53935 0%, #C62828 100%)' : '#FFFFFF',
                            color: isSender ? '#FFFFFF' : '#1A1D3B',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                            border: isSender ? 'none' : '1px solid #EEEEF5'
                          }}
                        >
                          <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.5, wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                            {msg.content}
                          </p>
                          <span style={{
                            display: 'block',
                            fontSize: '9px',
                            textAlign: 'right',
                            marginTop: '6px',
                            opacity: 0.7,
                            color: isSender ? '#FFE0B2' : '#A1A5B7'
                          }}>
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ margin: 'auto', textAlign: 'center', color: '#A1A5B7', padding: '20px' }}>
                    <MessageSquare size={24} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                    <p style={{ fontSize: '13px', margin: 0 }}>No messages yet. Send a message to start chatting!</p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input Action Form */}
              <form
                onSubmit={handleSendMessage}
                style={{
                  padding: '16px 20px',
                  background: '#FFFFFF',
                  borderTop: '1px solid #EEEEF5',
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'center'
                }}
              >
                <input
                  placeholder="Type your message here..."
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  disabled={sending}
                  style={{
                    flex: 1,
                    background: '#F4F5F9',
                    border: '1px solid #EEEEF5',
                    borderRadius: '24px',
                    padding: '10px 20px',
                    outline: 'none',
                    fontSize: '14px',
                    color: '#1A1D3B',
                    transition: 'border 0.2s'
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = '#E53935'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = '#EEEEF5'; }}
                />
                <button
                  type="submit"
                  disabled={sending || !newMessage.trim()}
                  style={{
                    background: (!newMessage.trim() || sending) ? '#F4F5F9' : 'linear-gradient(135deg, #E53935 0%, #C62828 100%)',
                    color: (!newMessage.trim() || sending) ? '#A1A5B7' : '#FFFFFF',
                    border: 'none',
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: (!newMessage.trim() || sending) ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: (!newMessage.trim() || sending) ? 'none' : '0 4px 12px rgba(229,57,53,0.2)'
                  }}
                >
                  <Send size={16} />
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
