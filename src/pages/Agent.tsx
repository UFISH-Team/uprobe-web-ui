import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Avatar,
  IconButton,
  useTheme,
  useMediaQuery,
  CircularProgress,
  Fade,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  InputAdornment,
} from '@mui/material';
import {
  Send,
  SmartToy,
  Person,
  Attachment,
  RestartAlt,
  Lightbulb,
  Science,
  AutoAwesome,
  Code,
  ContentCopy,
  Add,
  Delete,
  Settings,
  InsertDriveFile,
  Close,
  Download,
  Edit,
  Refresh,
  Search,
  FileDownload,
  MenuOpen,
  ChevronLeft,
} from '@mui/icons-material';
import { API_BASE_URL } from '../api';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  type?: 'text' | 'code' | 'result';
  thinking?: string[];
  attachments?: { id: string; filename: string; url: string; mime_type: string; size: number }[];
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  sessionId?: string;
  attachments?: { id: string; filename: string; url: string; mime_type: string; size: number }[];
  tags?: string[];
}

interface SuggestedPrompt {
  title: string;
  prompt: string;
  icon: React.ReactElement;
  category: string;
}

const Agent: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const REQUEST_TIMEOUT_MS = 600000;  // 10 minutes
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLDivElement>(null);
  
  // Session and API key management (HTTP-based)
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [tempApiKey, setTempApiKey] = useState('');
  const [model, setModel] = useState('gpt-4');
  const [proxy, setProxy] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' as 'success' | 'error' | 'info' | 'warning' });
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isReplaying, setIsReplaying] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  

  // Load API key and conversations from localStorage on component mount
  useEffect(() => {
    const savedApiKey = localStorage.getItem('uprobe-agent-api-key');
    const savedModel = localStorage.getItem('uprobe-agent-model');
    const savedProxy = localStorage.getItem('uprobe-agent-proxy');
    if (savedApiKey) {
      setApiKey(savedApiKey);
      setTempApiKey(savedApiKey);
    }
    if (savedModel) {
      setModel(savedModel);
    }
    if (savedProxy) {
      setProxy(savedProxy);
    }
    const savedConversations = localStorage.getItem('agent-conversations');
    if (savedConversations) {
      const parsed = JSON.parse(savedConversations);
      setConversations(parsed.map((conv: any) => ({
        ...conv,
        createdAt: new Date(conv.createdAt),
        updatedAt: new Date(conv.updatedAt),
        messages: conv.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        })),
        attachments: conv.attachments || [],
        tags: conv.tags || []
      })));
    }
  }, []);

  // Save conversations to localStorage whenever conversations change
  useEffect(() => {
    localStorage.setItem('agent-conversations', JSON.stringify(conversations));
  }, [conversations]);

  // Load current conversation messages
  useEffect(() => {
    if (currentConversationId) {
      const conversation = conversations.find(c => c.id === currentConversationId);
      setMessages(conversation?.messages || []);
      setSessionId(conversation?.sessionId || null);
    } else {
      setMessages([]);
      setSessionId(null);
    }
  }, [currentConversationId, conversations]);

  // Get current conversation attachments
  const currentAttachments = conversations.find(c => c.id === currentConversationId)?.attachments || [];

  const suggestedPrompts: SuggestedPrompt[] = [
    {
      title: 'Design FISH Probes',
      prompt: 'I want to design FISH probes for my target genes. Please help me create a design strategy.',
      icon: <Science />,
      category: 'Probe Design'
    },
    {
      title: 'Optimize Parameters',
      prompt: 'Please help me analyze and optimize probe Tm values, GC content, and specificity parameters.',
      icon: <AutoAwesome />,
      category: 'Optimization'
    },
    {
      title: 'Batch Processing',
      prompt: 'I have multiple target sequences. How do I set up a batch probe design workflow?',
      icon: <Code />,
      category: 'Batch Process'
    },
    {
      title: 'Result Analysis',
      prompt: 'Please explain the meaning of various indicators in probe design results and quality assessment.',
      icon: <Lightbulb />,
      category: 'Analysis'
    }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Session management
  const ensureSession = async (conversationId?: string | null) => {
    const existingSessionId =
      sessionId ||
      (conversationId
        ? (conversations.find(c => c.id === conversationId)?.sessionId || null)
        : null);

    if (existingSessionId) {
      if (!sessionId) setSessionId(existingSessionId);
      return existingSessionId;
    }

    if (!apiKey) {
      setSnackbar({
        open: true,
        message: '请先在 Settings 里填写 API Key',
        severity: 'error'
      });
      setShowApiKeyDialog(true);
      return null;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/agent/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: apiKey, model, proxy: proxy || undefined })
      });
      if (!res.ok) throw new Error('Failed to start session');
      const data = await res.json();
      setSessionId(data.session_id);

      if (conversationId) {
        setConversations(prev =>
          prev.map(conv =>
            conv.id === conversationId
              ? { ...conv, sessionId: data.session_id }
              : conv
          )
        );
      }

      return data.session_id as string;
    } catch (e) {
      console.error(e);
      setSnackbar({ open: true, message: 'Failed to start session', severity: 'error' });
      return null;
    }
  };

  const stopSession = async () => {
    if (!sessionId) return;
    try {
      await fetch(`${API_BASE_URL}/agent/stop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId })
      });
    } catch (e) {
      // ignore
    }
    setSessionId(null);
    if (currentConversationId) {
      setConversations(prev => prev.map(conv => conv.id === currentConversationId ? { ...conv, sessionId: undefined } : conv));
    }
    setSnackbar({ open: true, message: 'Agent session stopped', severity: 'info' });
  };

  const createNewConversation = () => {
    const newConversation: Conversation = {
      id: Date.now().toString(),
      title: 'New Conversation',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      sessionId: undefined,
      attachments: []
    };
    setConversations(prev => [newConversation, ...prev]);
    setCurrentConversationId(newConversation.id);
  };

  const deleteConversation = async (conversationId: string) => {
    const target = conversations.find(c => c.id === conversationId);
    if (target?.sessionId) {
      try {
        await fetch(`${API_BASE_URL}/agent/stop`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: target.sessionId })
        });
      } catch (e) {
        // ignore
      }
    }
    setConversations(prev => prev.filter(c => c.id !== conversationId));
    if (currentConversationId === conversationId) {
      setCurrentConversationId(null);
    }
  };

  const getUserTurnIndex = (messageId: string) => {
    let userIndex = -1;
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      if (msg.sender === 'user') userIndex += 1;
      if (msg.id === messageId) return userIndex;
    }
    return -1;
  };

  const handleEditStart = (message: Message) => {
    if (isLoading) return;
    setEditingMessageId(message.id);
    setEditValue(message.content);
  };

  const handleEditCancel = () => {
    setEditingMessageId(null);
    setEditValue('');
  };

  const handleEditSave = async (message: Message) => {
    if (isLoading) return;
    const newContent = editValue.trim();
    if (!newContent) {
      setSnackbar({ open: true, message: 'Content cannot be empty', severity: 'warning' });
      return;
    }
    const activeSessionId = sessionId || (currentConversationId ? conversations.find(c => c.id === currentConversationId)?.sessionId : null);
    if (!activeSessionId || !currentConversationId) {
      setSnackbar({ open: true, message: 'Please start a session first', severity: 'warning' });
      return;
    }
    const userTurnIndex = getUserTurnIndex(message.id);
    if (userTurnIndex < 0) {
      setSnackbar({ open: true, message: 'Cannot locate this message', severity: 'error' });
      return;
    }
    setIsLoading(true);
    setIsReplaying(true);
    const attachmentIds = (message.attachments || []).map(a => a.id);
    const pendingAssistantId = `pending-${Date.now().toString()}-${Math.random()}`;
    const pendingAssistantMessage: Message = {
      id: pendingAssistantId,
      content: 'Thinking...',
      thinking: [],
      sender: 'assistant',
      timestamp: new Date(),
      type: 'text'
    };
    try {
      // Optimistically truncate history after the edited user message
      setConversations(prev => prev.map(conv => {
        if (conv.id === currentConversationId) {
          const msgIndex = conv.messages.findIndex(m => m.id === message.id);
          if (msgIndex === -1) return conv;
          const updatedUser = { ...conv.messages[msgIndex], content: newContent };
          const truncated = [...conv.messages.slice(0, msgIndex), updatedUser];
          return { ...conv, messages: [...truncated, pendingAssistantMessage], updatedAt: new Date() };
        }
        return conv;
      }));

      // Create and store AbortController
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const res = await fetch(`${API_BASE_URL}/agent/rewind`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: activeSessionId, user_turn_index: userTurnIndex, content: newContent, attachment_ids: attachmentIds }),
        signal: controller.signal
      });
      abortControllerRef.current = null;
      if (!res.ok) throw new Error('Request failed');
      const data = await res.json();
      const assistantMessage: Message = {
        id: `${Date.now().toString()}-${Math.random()}`,
        content: data.message || '',
        thinking: Array.isArray(data.thinking) ? data.thinking : [],
        sender: 'assistant',
        timestamp: new Date(),
        type: 'text'
      };
      // Replace pending assistant message with the real response
      setConversations(prev => prev.map(conv => {
        if (conv.id === currentConversationId) {
          return {
            ...conv,
            messages: conv.messages.map(m => (m.id === pendingAssistantId ? assistantMessage : m)),
            updatedAt: new Date()
          };
        }
        return conv;
      }));
      setEditingMessageId(null);
      setEditValue('');
    } catch (error) {
      const isAborted = error instanceof DOMException && error.name === 'AbortError';
      if (isAborted) {
        setSnackbar({ open: true, message: 'Request cancelled', severity: 'warning' });
        // Don't remove the pending message if cancelled, maybe allow retry? 
        // For now let's just leave it or remove it based on preference. 
        // Removing pending message on cancel:
        setConversations(prev => prev.map(conv => {
          if (conv.id === currentConversationId) {
            return { ...conv, messages: conv.messages.filter(m => m.id !== pendingAssistantId), updatedAt: new Date() };
          }
          return conv;
        }));
      } else {
        console.error('Failed to rewind message:', error);
        setSnackbar({ open: true, message: 'Failed to re-execute', severity: 'error' });
        // Remove pending message on failure
        setConversations(prev => prev.map(conv => {
          if (conv.id === currentConversationId) {
            return { ...conv, messages: conv.messages.filter(m => m.id !== pendingAssistantId), updatedAt: new Date() };
          }
          return conv;
        }));
      }
    } finally {
      abortControllerRef.current = null;
      setIsLoading(false);
      setIsReplaying(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    // Create new conversation if none exists
    let conversationId = currentConversationId;
    if (!conversationId) {
      const newConversation: Conversation = {
        id: Date.now().toString(),
        title: 'New Conversation',
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        sessionId: undefined,
        attachments: []
      };
      setConversations(prev => [newConversation, ...prev]);
      conversationId = newConversation.id;
      setCurrentConversationId(conversationId);
    }

    // Ensure session (auto-start)
    const activeSessionId = await ensureSession(conversationId);
    if (!activeSessionId) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue.trim(),
      sender: 'user',
      timestamp: new Date(),
      type: 'text',
      attachments: currentAttachments.length > 0 ? [...currentAttachments] : undefined
    };

    // Update conversation with new message
    setConversations(prev => prev.map(conv => {
      if (conv.id === conversationId) {
        const updatedMessages = [...conv.messages, userMessage];
        // Update title if this is the first user message
        const title = conv.messages.length === 0 ? 
          userMessage.content.slice(0, 50) + (userMessage.content.length > 50 ? '...' : '') :
          conv.title;
        return { ...conv, messages: updatedMessages, title, updatedAt: new Date() };
      }
      return conv;
    }));

    setInputValue('');
    setIsLoading(true);
    
    // Collect attachment ids for this conversation
    const conv = conversations.find(c => c.id === conversationId);
    const attachmentIds = (conv?.attachments || []).map(a => a.id);

    // Send message via HTTP
    try {
      // Create and store AbortController for cancellation
      const controller = new AbortController();
      abortControllerRef.current = controller;
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
      const res = await fetch(`${API_BASE_URL}/agent/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: activeSessionId, content: userMessage.content, attachment_ids: attachmentIds }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      abortControllerRef.current = null;
      if (!res.ok) throw new Error('Request failed');
      const data = await res.json();
      // Expecting { thinking: string[], message: string }
      const assistantMessage: Message = {
        id: `${Date.now().toString()}-${Math.random()}`,
        content: data.message || '',
        thinking: Array.isArray(data.thinking) ? data.thinking : [],
        sender: 'assistant',
        timestamp: new Date(),
        type: 'text'
      };

      setConversations(prev => prev.map(conv => {
        if (conv.id === conversationId) {
          return { ...conv, messages: [...conv.messages, assistantMessage], updatedAt: new Date() };
        }
        return conv;
      }));
    } catch (error) {
      const isAborted = error instanceof DOMException && error.name === 'AbortError';
      if (isAborted) {
        setSnackbar({ open: true, message: 'Request cancelled', severity: 'warning' });
        try {
          await fetch(`${API_BASE_URL}/agent/stop`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session_id: activeSessionId })
          });
        } catch (e) {
          // ignore
        }
      } else {
        console.error('Failed to send message:', error);
        setSnackbar({ open: true, message: 'Failed to send message', severity: 'error' });
      }
    } finally {
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  };

  const handleChooseFiles = () => {
    if (isLoading) return;

    // Ensure a conversation exists before selecting files
    let convId = currentConversationId;
    if (!convId) {
      const newConversation: Conversation = {
        id: Date.now().toString(),
        title: 'New Conversation',
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        sessionId: undefined,
        attachments: []
      };
      setConversations(prev => [newConversation, ...prev]);
      setCurrentConversationId(newConversation.id);
      convId = newConversation.id;
    }

    void ensureSession(convId).then((sid) => {
      if (!sid) return;
      fileInputRef.current?.click();
    });
  };

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    // Ensure conversation id
    let convId = currentConversationId;
    if (!convId) {
      const newConversation: Conversation = {
        id: Date.now().toString(),
        title: 'New Conversation',
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        sessionId: sessionId || undefined,
        attachments: []
      };
      setConversations(prev => [newConversation, ...prev]);
      setCurrentConversationId(newConversation.id);
      convId = newConversation.id;
    }

    const activeSessionId = await ensureSession(convId);
    if (!activeSessionId) return;

    for (const file of Array.from(files)) {
      const fileId = `${Date.now()}-${Math.random()}`;
      setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));
      const form = new FormData();
      form.append('session_id', activeSessionId);
      form.append('file', file);
      try {
        setUploadProgress(prev => ({ ...prev, [fileId]: 50 }));
        const res = await fetch(`${API_BASE_URL}/agent/upload`, {
          method: 'POST',
          body: form
        });
        if (!res.ok) throw new Error('Upload failed');
        const data = await res.json();
        const targetId = convId;
        setUploadProgress(prev => ({ ...prev, [fileId]: 100 }));
        setConversations(prev => prev.map(conv => {
          if (conv.id === targetId) {
            const atts = conv.attachments || [];
            return { ...conv, attachments: [...atts, data], updatedAt: new Date() };
          }
          return conv;
        }));
        setTimeout(() => {
          setUploadProgress(prev => {
            const updated = { ...prev };
            delete updated[fileId];
            return updated;
          });
        }, 1000);
        setSnackbar({ open: true, message: `Uploaded ${file.name}`, severity: 'success' });
      } catch (err) {
        setUploadProgress(prev => {
          const updated = { ...prev };
          delete updated[fileId];
          return updated;
        });
        setSnackbar({ open: true, message: `Failed to upload ${file.name}`, severity: 'error' });
      }
    }
    // reset input
    e.target.value = '';
  };

  const handleRemoveAttachment = async (attachmentId: string) => {
    if (!sessionId || !currentConversationId) return;
    try {
      const url = new URL(`${API_BASE_URL}/agent/upload/${attachmentId}`);
      url.searchParams.set('session_id', sessionId);
      const res = await fetch(url.toString(), { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      const convId = currentConversationId;
      setConversations(prev => prev.map(conv => {
        if (conv.id === convId) {
          const atts = (conv.attachments || []).filter(a => a.id !== attachmentId);
          return { ...conv, attachments: atts, updatedAt: new Date() };
        }
        return conv;
      }));
    } catch (e) {
      setSnackbar({ open: true, message: 'Failed to delete attachment', severity: 'error' });
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const handleSuggestedPrompt = (prompt: string) => {
    setInputValue(prompt);
    inputRef.current?.focus();
  };

  const handleCancelRequest = async () => {
    if (!abortControllerRef.current) return;
    
    // Abort the ongoing request
    abortControllerRef.current.abort();
    abortControllerRef.current = null;
    setIsLoading(false);
    setIsReplaying(false);
    
    setSnackbar({ open: true, message: 'Request cancelled', severity: 'info' });

    // Also stop the backend session to ensure agent stops processing
    const activeSessionId = sessionId || conversations.find(c => c.id === currentConversationId)?.sessionId;
    if (activeSessionId) {
      try {
        await fetch(`${API_BASE_URL}/agent/stop`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: activeSessionId })
        });
        // We don't clear the session ID here to allow the user to continue chatting
        // But we might need to "restart" the session internally on next message if the server truly killed it.
        // For now, assume "stop" just kills the current run but keeps history if supported, 
        // OR we might need to re-initialize on next message. 
        // Based on backend implementation, /agent/stop deletes the chat.
        // So we should probably clear the session ID.
        setSessionId(null);
        setConversations(prev => prev.map(conv => 
          conv.id === currentConversationId 
            ? { ...conv, sessionId: undefined } 
            : conv
        ));
      } catch (e) {
        console.error('Failed to stop session on cancel:', e);
      }
    }
  };

  const handleClearChat = async () => {
    if (!currentConversationId) return;
    
    // Cancel ongoing request if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    // Stop backend session
    const activeSessionId = sessionId || conversations.find(c => c.id === currentConversationId)?.sessionId;
    if (activeSessionId) {
      try {
        await fetch(`${API_BASE_URL}/agent/stop`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: activeSessionId })
        });
        // Clear session reference
        setSessionId(null);
        setConversations(prev => prev.map(conv => 
          conv.id === currentConversationId 
            ? { ...conv, sessionId: undefined } 
            : conv
        ));
      } catch (e) {
        console.error('Failed to stop session:', e);
      }
    }
    
    // Clear frontend messages
    setConversations(prev => prev.map(conv => 
      conv.id === currentConversationId 
        ? { ...conv, messages: [], updatedAt: new Date() }
        : conv
    ));
    
    setIsLoading(false);
    setSnackbar({ open: true, message: 'Chat cleared and session stopped', severity: 'info' });
  };
  const handleRegenerateMessage = async (messageId: string) => {
    const messageIndex = messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1 || messageIndex === 0) return;
    const previousMessage = messages[messageIndex - 1];
    if (previousMessage.sender !== 'user') return;
    const activeSessionId = sessionId || (currentConversationId ? conversations.find(c => c.id === currentConversationId)?.sessionId : null);
    if (!activeSessionId || !currentConversationId) {
      setSnackbar({ open: true, message: 'Please start a session first', severity: 'warning' });
      return;
    }
    const userTurnIndex = getUserTurnIndex(previousMessage.id);
    if (userTurnIndex < 0) return;
    setIsLoading(true);
    setIsReplaying(true);
    const attachmentIds = (previousMessage.attachments || []).map(a => a.id);
    const pendingAssistantId = `pending-${Date.now().toString()}-${Math.random()}`;
    const pendingAssistantMessage: Message = {
      id: pendingAssistantId,
      content: 'Thinking...',
      thinking: [],
      sender: 'assistant',
      timestamp: new Date(),
      type: 'text'
    };
    try {
      // Optimistically truncate from the assistant message being regenerated and append a pending placeholder
      setConversations(prev => prev.map(conv => {
        if (conv.id === currentConversationId) {
          const truncated = conv.messages.slice(0, messageIndex);
          return { ...conv, messages: [...truncated, pendingAssistantMessage], updatedAt: new Date() };
        }
        return conv;
      }));

      // Create and store AbortController
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const res = await fetch(`${API_BASE_URL}/agent/rewind`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: activeSessionId, user_turn_index: userTurnIndex, content: previousMessage.content, attachment_ids: attachmentIds }),
        signal: controller.signal
      });
      abortControllerRef.current = null;
      if (!res.ok) throw new Error('Request failed');
      const data = await res.json();
      const newAssistantMessage: Message = {
        id: `${Date.now().toString()}-${Math.random()}`,
        content: data.message || '',
        thinking: Array.isArray(data.thinking) ? data.thinking : [],
        sender: 'assistant',
        timestamp: new Date(),
        type: 'text'
      };
      setConversations(prev => prev.map(conv => {
        if (conv.id === currentConversationId) {
          return {
            ...conv,
            messages: conv.messages.map(m => (m.id === pendingAssistantId ? newAssistantMessage : m)),
            updatedAt: new Date()
          };
        }
        return conv;
      }));
    } catch (error) {
      const isAborted = error instanceof DOMException && error.name === 'AbortError';
      if (isAborted) {
        setSnackbar({ open: true, message: 'Request cancelled', severity: 'warning' });
      } else {
        console.error('Failed to regenerate:', error);
        setSnackbar({ open: true, message: 'Failed to regenerate', severity: 'error' });
      }
      setConversations(prev => prev.map(conv => {
        if (conv.id === currentConversationId) {
          return { ...conv, messages: conv.messages.filter(m => m.id !== pendingAssistantId), updatedAt: new Date() };
        }
        return conv;
      }));
    } finally {
      abortControllerRef.current = null;
      setIsLoading(false);
      setIsReplaying(false);
    }
  };
  const exportConversation = () => {
    if (!currentConversationId) return;
    const conversation = conversations.find(c => c.id === currentConversationId);
    if (!conversation) return;
    let markdown = `# ${conversation.title}\n\n`;
    markdown += `Created: ${conversation.createdAt.toLocaleString()}\n\n---\n\n`;
    conversation.messages.forEach(msg => {
      const sender = msg.sender === 'user' ? '**User**' : '**Assistant**';
      markdown += `### ${sender} - ${msg.timestamp.toLocaleString()}\n\n`;
      markdown += `${msg.content}\n\n`;
      if (msg.thinking && msg.thinking.length > 0) {
        markdown += `<details>\n<summary>Thinking Process</summary>\n\n${msg.thinking.join('\n\n')}\n</details>\n\n`;
      }
      markdown += '---\n\n';
    });
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${conversation.title.replace(/[^a-z0-9]/gi, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
    setSnackbar({ open: true, message: 'Conversation exported', severity: 'success' });
  };
  const filteredConversations = searchQuery.trim()
    ? conversations.filter(conv => 
        conv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.messages.some(msg => msg.content.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : conversations;
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget === e.target) {
      setIsDragging(false);
    }
  }, []);
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);
  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;
    let convId = currentConversationId;
    if (!convId) {
      const newConversation: Conversation = {
        id: Date.now().toString(),
        title: 'New Chat',
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        sessionId: sessionId || undefined,
        attachments: [],
        tags: []
      };
      setConversations(prev => [newConversation, ...prev]);
      setCurrentConversationId(newConversation.id);
      convId = newConversation.id;
    }
    const activeSessionId = await ensureSession(convId);
    if (!activeSessionId) return;
    for (const file of files) {
      const fileId = `${Date.now()}-${Math.random()}`;
      setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));
      const form = new FormData();
      form.append('session_id', activeSessionId);
      form.append('file', file);
      try {
        setUploadProgress(prev => ({ ...prev, [fileId]: 50 }));
        const res = await fetch(`${API_BASE_URL}/agent/upload`, {
          method: 'POST',
          body: form
        });
        if (!res.ok) throw new Error('Upload failed');
        const data = await res.json();
        setUploadProgress(prev => ({ ...prev, [fileId]: 100 }));
        setConversations(prev => prev.map(conv => {
          if (conv.id === convId) {
            const atts = conv.attachments || [];
            return { ...conv, attachments: [...atts, data], updatedAt: new Date() };
          }
          return conv;
        }));
        setTimeout(() => {
          setUploadProgress(prev => {
            const updated = { ...prev };
            delete updated[fileId];
            return updated;
          });
        }, 1000);
        setSnackbar({ open: true, message: `Uploaded ${file.name}`, severity: 'success' });
      } catch (err) {
        setUploadProgress(prev => {
          const updated = { ...prev };
          delete updated[fileId];
          return updated;
        });
        setSnackbar({ open: true, message: `Failed to upload ${file.name}`, severity: 'error' });
      }
    }
  }, [sessionId, currentConversationId, conversations, apiKey, model, proxy]);
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch(prev => !prev);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        createNewConversation();
      }
      if (e.key === 'Escape') {
        setShowSearch(false);
        setEditingMessageId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSaveApiKey = () => {
    if (!tempApiKey.trim()) {
      setSnackbar({ open: true, message: 'Please enter API Key', severity: 'error' });
      return;
    }

    setApiKey(tempApiKey);
    localStorage.setItem('uprobe-agent-api-key', tempApiKey);
    localStorage.setItem('uprobe-agent-model', model);
    if (proxy) {
      localStorage.setItem('uprobe-agent-proxy', proxy);
    } else {
      localStorage.removeItem('uprobe-agent-proxy');
    }
    
    setShowApiKeyDialog(false);
    setSnackbar({ open: true, message: 'API configuration saved', severity: 'success' });

    // Stop existing session if any
    if (sessionId) {
      stopSession();
    }

    // Auto-start session after saving config
    void ensureSession(currentConversationId);
  };

  const renderMessage = (message: Message) => {
    const isUser = message.sender === 'user';
    const isEditing = isUser && editingMessageId === message.id;

    const renderContentWithCodeBlocks = (content: string) => {
      // Enhanced Markdown parser with code blocks, formatting, lists, headings
      const parts: React.ReactNode[] = [];
      const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
      let lastIndex = 0;
      let match: RegExpExecArray | null;
      
      // Enhanced text formatter with Markdown support
      const formatText = (text: string): React.ReactNode[] => {
        const lines = text.split('\n');
        const elements: React.ReactNode[] = [];
        
        lines.forEach((line, lineIdx) => {
          // Check for headings (### or ## or #)
          const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);
          if (headingMatch) {
            const level = headingMatch[1].length;
            const headingText = headingMatch[2];
            const fontSize = level === 1 ? '1.25rem' : level === 2 ? '1.1rem' : '1rem';
            const fontWeight = level === 1 ? 700 : 600;
            elements.push(
              <Typography 
                key={`heading-${lineIdx}`} 
                sx={{ 
                  fontSize, 
                  fontWeight, 
                  color: '#0f172a', 
                  mt: lineIdx > 0 ? 2 : 0, 
                  mb: 1,
                  lineHeight: 1.4
                }}
              >
                {formatInlineMarkdown(headingText, `h-${lineIdx}`)}
              </Typography>
            );
            return;
          }
          
          // Check for list items (- or *)
          const listMatch = line.match(/^[\s]*[-*]\s+(.+)$/);
          if (listMatch) {
            elements.push(
              <Box key={`list-${lineIdx}`} sx={{ display: 'flex', gap: 1, mb: 0.5, pl: 2 }}>
                <Typography sx={{ color: '#64748b', minWidth: '20px' }}>•</Typography>
                <Typography sx={{ flex: 1, color: '#1e293b' }}>
                  {formatInlineMarkdown(listMatch[1], `li-${lineIdx}`)}
                </Typography>
              </Box>
            );
            return;
          }
          
          // Regular paragraph
          if (line.trim()) {
            elements.push(
              <Typography 
                key={`p-${lineIdx}`} 
                component="div"
                sx={{ color: '#1e293b', mb: 0.75, lineHeight: 1.65 }}
              >
                {formatInlineMarkdown(line, `p-${lineIdx}`)}
              </Typography>
            );
          } else if (lineIdx < lines.length - 1) {
            // Empty line - add spacing
            elements.push(<Box key={`space-${lineIdx}`} sx={{ height: '0.5rem' }} />);
          }
        });
        
        return elements;
      };
      
      // Format inline markdown (bold, italic, links, inline code)
      const formatInlineMarkdown = (text: string, keyPrefix: string): React.ReactNode[] => {
        const nodes: React.ReactNode[] = [];
        let remaining = text;
        let nodeIndex = 0;
        
        // Combined regex for bold, links, inline code
        const inlineRegex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(https?:\/\/[^\s]+)|(\/agent\/(?:files|uploads)\/[^\s]+)|(`([^`]+)`)/g;
        let lastIdx = 0;
        let m: RegExpExecArray | null;
        
        while ((m = inlineRegex.exec(remaining)) !== null) {
          // Add text before match
          if (m.index > lastIdx) {
            nodes.push(<span key={`${keyPrefix}-t-${nodeIndex++}`}>{remaining.slice(lastIdx, m.index)}</span>);
          }
          
          if (m[1]) {
            // Bold **text**
            nodes.push(<strong key={`${keyPrefix}-b-${nodeIndex++}`} style={{ fontWeight: 600, color: '#0f172a' }}>{m[2]}</strong>);
          } else if (m[3]) {
            // Italic *text*
            nodes.push(<em key={`${keyPrefix}-i-${nodeIndex++}`} style={{ fontStyle: 'italic' }}>{m[4]}</em>);
          } else if (m[5] || m[6]) {
            // Link
            const url = m[5] || m[6];
            nodes.push(
              <a 
                key={`${keyPrefix}-a-${nodeIndex++}`} 
                href={url} 
                target="_blank" 
                rel="noopener noreferrer" 
                style={{ color: '#2563eb', textDecoration: 'underline', fontWeight: 500 }}
              >
                {url}
              </a>
            );
          } else if (m[7]) {
            // Inline code `text`
            nodes.push(
              <code 
                key={`${keyPrefix}-c-${nodeIndex++}`}
                style={{ 
                  backgroundColor: '#f1f5f9', 
                  color: '#dc2626', 
                  padding: '2px 6px', 
                  borderRadius: '4px', 
                  fontSize: '0.875em',
                  fontFamily: 'monospace'
                }}
              >
                {m[8]}
              </code>
            );
          }
          
          lastIdx = inlineRegex.lastIndex;
        }
        
        // Add remaining text
        if (lastIdx < remaining.length) {
          nodes.push(<span key={`${keyPrefix}-end`}>{remaining.slice(lastIdx)}</span>);
        }
        
        return nodes.length > 0 ? nodes : [<span key={`${keyPrefix}-fallback`}>{text}</span>];
      };
      
      // Process code blocks
      while ((match = codeBlockRegex.exec(content)) !== null) {
        if (match.index > lastIndex) {
          const text = content.slice(lastIndex, match.index);
          parts.push(<Box key={`t-${lastIndex}`}>{formatText(text)}</Box>);
        }
        const lang = (match[1] || '').toLowerCase();
        const code = match[2];
        parts.push(
          <Box key={`c-${match.index}`} sx={{ my: 1.5 }}>
            <Paper 
              variant="outlined" 
              sx={{ 
                backgroundColor: '#0f172a', 
                color: '#e2e8f0', 
                overflowX: 'auto',
                border: '1px solid #1e293b',
                borderRadius: 1.5,
                overflow: 'hidden'
              }}
            >
              <Box sx={{ 
                px: 1.75, 
                py: 0.75, 
                backgroundColor: '#1e293b', 
                borderBottom: '1px solid #334155',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {lang || 'code'}
                </Typography>
              </Box>
              <Box sx={{ px: 1.75, py: 1.5 }}>
                <pre style={{ margin: 0, fontFamily: '"JetBrains Mono", Monaco, Menlo, Consolas, monospace', fontSize: '0.8125rem', lineHeight: 1.5 }}>
                  <code>{code}</code>
                </pre>
              </Box>
            </Paper>
          </Box>
        );
        lastIndex = codeBlockRegex.lastIndex;
      }
      if (lastIndex < content.length) {
        const text = content.slice(lastIndex);
        parts.push(<Box key={`t-end`}>{formatText(text)}</Box>);
      }
      return parts;
    };
    const normalizeText = (text: string) => {
      if (!text) return '';
      return text
        .replace(/\r\n/g, '\n')
        .replace(/\\n/g, '\n')
        .trim();
    };
    const primaryThinking = normalizeText((message.thinking && message.thinking.length > 0) ? message.thinking.join('\n') : '');
    const finalMessage = normalizeText(message.content || '');
    let combinedContent = '';
    if (primaryThinking && finalMessage) {
      if (
        primaryThinking === finalMessage ||
        primaryThinking.includes(finalMessage) ||
        finalMessage.includes(primaryThinking)
      ) {
        combinedContent = primaryThinking; // 优先展示思考（前一个）
      } else {
        combinedContent = `${primaryThinking}\n\n${finalMessage}`;
      }
    } else if (primaryThinking) {
      combinedContent = primaryThinking;
    } else {
      combinedContent = finalMessage;
    }
    return (
      <Fade in={true} timeout={300} key={message.id}>
        <Box
          sx={{
            display: 'flex',
            mb: 2,
            flexDirection: isUser ? 'row-reverse' : 'row',
            alignItems: 'flex-start',
            '&:hover .message-actions': {
              opacity: 1
            }
          }}
        >
          <Avatar
            sx={{
              bgcolor: isUser ? theme.palette.primary.main : theme.palette.secondary.main,
              mx: 1,
              width: 28,
              height: 28
            }}
          >
            {isUser ? <Person sx={{ fontSize: 16 }} /> : <SmartToy sx={{ fontSize: 16 }} />}
          </Avatar>
          <Box
            sx={{
              maxWidth: isEditing ? '85%' : '75%',
              width: isEditing ? '100%' : 'fit-content',
              display: 'inline-block'
            }}
          >
          <Paper
            elevation={0}
            sx={{
              py: 1.25,
              px: 1.75,
              ...(isUser
                ? { 
                    backgroundColor: '#f1f5f9',
                    boxShadow: 'none'
                  }
                : { 
                    backgroundColor: '#f8fafc',
                    boxShadow: 'none'
                  }
              ),
              color: '#1e293b',
              borderRadius: 2,
              border: '1px solid #e2e8f0'
            }}
          >
            {isEditing ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                <TextField
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleEditSave(message);
                    }
                  }}
                  multiline
                  minRows={1}
                  maxRows={8}
                  fullWidth
                  variant="outlined"
                  autoFocus
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#ffffff',
                      color: '#1e293b',
                      fontSize: '0.9375rem',
                      lineHeight: 1.65,
                      paddingY: 0.75,
                      '& fieldset': { borderColor: '#cbd5e1' },
                      '&:hover fieldset': { borderColor: '#94a3b8' },
                      '&.Mui-focused fieldset': { 
                        borderColor: theme.palette.primary.main, 
                        borderWidth: 1.5,
                        boxShadow: '0 0 0 2px rgba(37, 99, 235, 0.1)'
                      }
                    }
                  }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5, mt: 0.5 }}>
                  <Tooltip title="Cancel (Esc)">
                    <IconButton
                      size="small"
                      onClick={handleEditCancel}
                      sx={{
                        width: 26,
                        height: 26,
                        color: '#94a3b8',
                        '&:hover': { color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.08)' }
                      }}
                    >
                      <Close sx={{ fontSize: 15 }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Save & Run (Enter)">
                    <IconButton
                      size="small"
                      onClick={() => handleEditSave(message)}
                      disabled={isLoading || isReplaying}
                      sx={{
                        width: 26,
                        height: 26,
                        color: '#94a3b8',
                        '&:hover': { color: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.08)' },
                        '&:disabled': { color: '#cbd5e1' }
                      }}
                    >
                      <Send sx={{ fontSize: 13 }} />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            ) : (
              <Typography
                variant="body1"
                component="div"
                sx={{
                  lineHeight: 1.65,
                  whiteSpace: 'pre-wrap',
                  fontSize: '0.9375rem',
                  color: '#1e293b',
                  '& p': {
                    margin: '0.5em 0'
                  },
                  '& a': {
                    color: theme.palette.primary.main,
                    textDecoration: 'none',
                    '&:hover': {
                      textDecoration: 'underline'
                    }
                  }
                }}
              >
                {renderContentWithCodeBlocks(combinedContent)}
              </Typography>
            )}
            {/* Attachments in message bubble */}
            {isUser && message.attachments && message.attachments.length > 0 && (
              <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid #e2e8f0' }}>
                <Typography variant="caption" sx={{ color: '#64748b', mb: 1, display: 'block', fontWeight: 600 }}>
                  Attached Files
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                  {message.attachments.map(att => (
                    <Box 
                      key={att.id}
                      sx={{ 
                        display: 'flex',
                        alignItems: 'center',
                        p: 1,
                        borderRadius: 1.5,
                        backgroundColor: '#ffffff',
                        border: '1px solid #e2e8f0',
                        transition: 'all 0.2s',
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: '#f8fafc',
                          borderColor: theme.palette.primary.main
                        }
                      }}
                      onClick={() => window.open(att.url, '_blank')}
                    >
                      <InsertDriveFile sx={{ fontSize: 16, color: theme.palette.primary.main, mr: 1 }} />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            color: '#1e293b',
                            fontWeight: 500,
                            display: 'block',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {att.filename}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.7rem' }}>
                          {(att.size / 1024).toFixed(1)} KB
                        </Typography>
                      </Box>
                      <Download sx={{ fontSize: 16, color: '#64748b' }} />
                    </Box>
                  ))}
                </Box>
              </Box>
            )}
          </Paper>
          {/* Action buttons outside bubble */}
          {!isUser && !isEditing && (
            <Box 
              className="message-actions"
              sx={{ 
                mt: 0.5, 
                display: 'flex', 
                gap: 0.25, 
                opacity: 0, 
                transition: 'opacity 0.2s ease'
              }}
            >
              <Tooltip title="Copy">
                <IconButton
                  size="small"
                  sx={{ 
                    width: 24,
                    height: 24,
                    color: '#94a3b8',
                    '&:hover': { 
                      color: '#1e293b', 
                      backgroundColor: 'rgba(148, 163, 184, 0.08)' 
                    }
                  }}
                  onClick={() => {
                    navigator.clipboard.writeText(combinedContent);
                    setSnackbar({ open: true, message: 'Copied', severity: 'success' });
                  }}
                >
                  <ContentCopy sx={{ fontSize: 14 }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Retry">
                <IconButton
                  size="small"
                  sx={{ 
                    width: 24,
                    height: 24,
                    color: '#94a3b8',
                    '&:hover': { 
                      color: '#1e293b', 
                      backgroundColor: 'rgba(148, 163, 184, 0.08)' 
                    },
                    '&:disabled': { color: '#cbd5e1' }
                  }}
                  onClick={() => handleRegenerateMessage(message.id)}
                  disabled={isLoading}
                >
                  <Refresh sx={{ fontSize: 14 }} />
                </IconButton>
              </Tooltip>
            </Box>
          )}
          {isUser && !isEditing && (
            <Box 
              className="message-actions"
              sx={{ 
                mt: 0.5, 
                display: 'flex', 
                justifyContent: 'flex-end', 
                gap: 0.25, 
                opacity: 0, 
                transition: 'opacity 0.2s ease'
              }}
            >
              <Tooltip title="Edit">
                <IconButton
                  size="small"
                  sx={{ 
                    width: 24,
                    height: 24,
                    color: '#94a3b8',
                    '&:hover': { 
                      color: '#1e293b', 
                      backgroundColor: 'rgba(148, 163, 184, 0.08)' 
                    }
                  }}
                  onClick={() => handleEditStart(message)}
                >
                  <Edit sx={{ fontSize: 14 }} />
                </IconButton>
              </Tooltip>
            </Box>
          )}
        </Box>
      </Box>
      </Fade>
    );
  };

  return (
    <Box sx={{
      height: 'calc(100vh - 64px)',
      display: 'flex',
      backgroundColor: '#ffffff'
    }}>
      <Box sx={{ width: '100%', display: 'flex', height: '100%' }}>
          {/* Left Sidebar - Conversation History */}
          {!isMobile && !sidebarCollapsed && (
            <Box
              sx={{
                width: '280px',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderRight: '1px solid #e2e8f0',
                backgroundColor: '#fafbfc'
              }}
            >
                {/* Header */}
                <Box sx={{ px: 3, py: 2, borderBottom: '1px solid #e2e8f0', backgroundColor: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: '64px' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.125rem', color: '#1e293b' }}>
                      Chat
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Tooltip title="New Chat (Ctrl+N)">
                        <IconButton size="small" onClick={createNewConversation}>
                          <Add fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Search (Ctrl+K)">
                        <IconButton
                          size="small"
                          onClick={() => setShowSearch(prev => !prev)}
                          sx={{ color: showSearch ? theme.palette.primary.main : 'inherit' }}
                        >
                          <Search fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Settings">
                        <IconButton
                          size="small"
                          onClick={() => setShowApiKeyDialog(true)}
                        >
                          <Settings fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Collapse Sidebar">
                        <IconButton size="small" onClick={() => setSidebarCollapsed(true)}>
                          <ChevronLeft fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                </Box>
                {showSearch && (
                  <Box sx={{ px: 3, pb: 1.5 }}>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Search conversations... (Ctrl+K)"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      sx={{ mt: 1.25 }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Search />
                          </InputAdornment>
                        ),
                        endAdornment: searchQuery && (
                          <InputAdornment position="end">
                            <IconButton size="small" onClick={() => setSearchQuery('')}>
                              <Close fontSize="small" />
                            </IconButton>
                          </InputAdornment>
                        )
                      }}
                    />
                  </Box>
                )}

                {/* Conversation List */}
                <Box sx={{ flex: 1, overflowY: 'auto', px: 1.5, py: 1 }}>
                  {filteredConversations.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 6 }}>
                      <Typography variant="body2" sx={{ color: '#94a3b8', fontSize: '0.875rem' }}>
                        {searchQuery ? 'No matching conversations' : 'No conversations yet'}
                      </Typography>
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      {filteredConversations.map((conversation) => (
                        <Box
                          key={conversation.id}
                          onClick={() => setCurrentConversationId(conversation.id)}
                          sx={{
                            position: 'relative',
                            cursor: 'pointer',
                            py: 1,
                            px: 1.5,
                            borderRadius: 1.5,
                            transition: 'background-color 0.15s ease',
                            backgroundColor: currentConversationId === conversation.id ? 
                              'rgba(37, 99, 235, 0.08)' : 
                              'transparent',
                            '&:hover': {
                              backgroundColor: currentConversationId === conversation.id ? 
                                'rgba(37, 99, 235, 0.12)' : 
                                'rgba(148, 163, 184, 0.08)',
                              '& .delete-icon': {
                                opacity: 1
                              }
                            }
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                            <Typography 
                              variant="body2"
                              noWrap
                              sx={{ 
                                flex: 1,
                                fontSize: '0.875rem',
                                fontWeight: currentConversationId === conversation.id ? 500 : 400,
                                color: currentConversationId === conversation.id ? '#1e293b' : '#475569',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}
                            >
                              {conversation.title}
                            </Typography>
                            <IconButton
                              className="delete-icon"
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteConversation(conversation.id);
                              }}
                              sx={{ 
                                opacity: 0,
                                transition: 'opacity 0.15s ease',
                                width: 24,
                                height: 24,
                                color: '#64748b',
                                '&:hover': { 
                                  color: '#ef4444',
                                  backgroundColor: 'rgba(239, 68, 68, 0.1)'
                                }
                              }}
                            >
                              <Delete sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  )}
                </Box>

                {/* Suggested Prompts */}
                <Box sx={{ px: 3, py: 1.5, borderTop: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
                  <Typography variant="caption" sx={{ mb: 1, display: 'block', color: '#64748b', fontWeight: 600, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Quick Starts
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    {suggestedPrompts.slice(0, 2).map((prompt, index) => (
                      <Box
                        key={index}
                        onClick={() => handleSuggestedPrompt(prompt.prompt)}
                        sx={{
                          py: 0.75,
                          px: 1.25,
                          borderRadius: 1.5,
                          cursor: 'pointer',
                          fontSize: '0.8125rem',
                          color: theme.palette.primary.main,
                          fontWeight: 500,
                          transition: 'background-color 0.15s ease',
                          '&:hover': {
                            backgroundColor: 'rgba(37, 99, 235, 0.08)'
                          }
                        }}
                      >
                        {prompt.title}
                      </Box>
                    ))}
                  </Box>
                </Box>
            </Box>
          )}
          {/* Collapsed Sidebar Toggle */}
          {!isMobile && sidebarCollapsed && (
            <Box sx={{ display: 'flex', alignItems: 'flex-start', p: 2 }}>
              <Tooltip title="Expand Sidebar">
                <IconButton 
                  onClick={() => setSidebarCollapsed(false)}
                  sx={{ 
                    backgroundColor: 'rgba(0,0,0,0.05)',
                    '&:hover': {
                      backgroundColor: 'rgba(0,0,0,0.08)'
                    }
                  }}
                >
                  <MenuOpen />
                </IconButton>
              </Tooltip>
            </Box>
          )}
          {/* Main Chat Area */}
          <Box
            sx={{
              flex: 1,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: '#ffffff',
              position: 'relative'
            }}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
              {/* Drag Overlay */}
              {isDragging && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(37, 99, 235, 0.04)',
                    border: `2px dashed ${theme.palette.primary.main}`,
                    borderRadius: 0,
                    zIndex: 1000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backdropFilter: 'blur(2px)'
                  }}
                >
                  <Box sx={{ textAlign: 'center' }}>
                    <Attachment sx={{ fontSize: 48, color: theme.palette.primary.main, mb: 1.5, opacity: 0.8 }} />
                    <Typography variant="body1" sx={{ color: theme.palette.primary.main, fontWeight: 500 }}>
                      Drop files to upload
                    </Typography>
                  </Box>
                </Box>
              )}
              {/* Chat Header */}
              <Box
                sx={{
                  px: 3,
                  py: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid #e2e8f0',
                  backgroundColor: '#ffffff',
                  minHeight: '64px'
                }}
              >
                  <Typography variant="h6" noWrap sx={{ fontWeight: 600, fontSize: '1.125rem', color: '#1e293b' }}>
                   ✨ U-Probe Assistant
                  </Typography>
                  {currentConversationId && (
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="Export">
                        <IconButton size="small" onClick={exportConversation} sx={{ color: '#64748b' }}>
                          <FileDownload fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Clear">
                        <IconButton size="small" onClick={handleClearChat} sx={{ color: '#64748b' }}>
                          <RestartAlt fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  )}
              </Box>

                {/* Message List */}
              <Box
                sx={{
                  flex: 1,
                  px: 3,
                  py: 2,
                  overflowY: 'auto',
                  backgroundColor: '#ffffff',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                {messages.length === 0 ? (
                  <Box
                    sx={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center'
                    }}
                  >
                    <Box sx={{ maxWidth: 400 }}>
                      <Typography variant="h5" sx={{ mb: 1.5, fontWeight: 600, color: '#1e293b' }}>
                        U-Probe Assistant
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#64748b', lineHeight: 1.6 }}>
                        I can help you design probes, optimize parameters, and answer questions
                      </Typography>
                    </Box>
                  </Box>
                ) : (
                  <>
                    {messages.map(renderMessage)}
                    {isLoading && !isReplaying && (
                      <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2, alignItems: 'flex-start' }}>
                        <Avatar
                          sx={{
                            bgcolor: theme.palette.secondary.main,
                            mx: 1,
                            width: 28,
                            height: 28
                          }}
                        >
                          <SmartToy sx={{ fontSize: 16 }} />
                        </Avatar>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                          <Paper
                            elevation={0}
                            sx={{
                              py: 1.25,
                              px: 1.75,
                              backgroundColor: '#f8fafc',
                              borderRadius: 2,
                              border: '1px solid #e2e8f0',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1.5
                            }}
                          >
                            <CircularProgress size={14} thickness={4} sx={{ color: '#64748b' }} />
                            <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.875rem' }}>
                              Thinking...
                            </Typography>
                          </Paper>
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            onClick={handleCancelRequest}
                            sx={{
                              fontSize: '0.75rem',
                              py: 0.5,
                              px: 1.5,
                              textTransform: 'none',
                              borderRadius: 1.5,
                              alignSelf: 'flex-start'
                            }}
                          >
                            Cancel
                          </Button>
                        </Box>
                      </Box>
                    )}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </Box>

              {/* Input Area */}
              <Box
                sx={{
                  px: 3,
                  py: 2,
                  borderTop: '1px solid #e2e8f0',
                  backgroundColor: '#f8fafc'
                }}
              >
                {/* Attachments Display - Modern Card Style */}
                {currentAttachments.length > 0 && (
                  <Box sx={{ mb: 1.5 }}>
                    <Typography variant="caption" sx={{ color: '#64748b', mb: 0.75, display: 'block', fontWeight: 600, fontSize: '0.75rem' }}>
                      {currentAttachments.length} file{currentAttachments.length > 1 ? 's' : ''}
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {currentAttachments.map(att => (
                        <Box 
                          key={att.id}
                          sx={{ 
                            display: 'flex',
                            alignItems: 'center',
                            py: 0.75,
                            px: 1.25,
                            border: '1px solid #cbd5e1',
                            borderRadius: 1.5,
                            backgroundColor: '#ffffff',
                            transition: 'all 0.15s ease',
                            '&:hover': {
                              borderColor: theme.palette.primary.main,
                              backgroundColor: 'rgba(37, 99, 235, 0.04)'
                            }
                          }}
                        >
                          <InsertDriveFile sx={{ fontSize: 16, color: theme.palette.primary.main, mr: 0.75 }} />
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              fontWeight: 500,
                              fontSize: '0.8125rem',
                              color: '#1e293b',
                              maxWidth: 150,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {att.filename}
                          </Typography>
                          <IconButton 
                            size="small" 
                            onClick={() => handleRemoveAttachment(att.id)}
                            sx={{ 
                              ml: 0.5,
                              width: 20,
                              height: 20,
                              color: '#64748b',
                              '&:hover': { 
                                color: '#ef4444',
                                backgroundColor: 'rgba(239, 68, 68, 0.08)'
                              }
                            }}
                          >
                            <Close sx={{ fontSize: 14 }} />
                          </IconButton>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}

                {/* Upload Progress Indicators */}
                {Object.keys(uploadProgress).length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    {Object.entries(uploadProgress).map(([id, progress]) => (
                      <Box key={id} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                        <CircularProgress size={20} variant="determinate" value={progress} />
                        <Typography variant="caption" color="text.secondary">
                          Uploading... {progress}%
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                )}

                <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                  <TextField
                    ref={inputRef}
                    multiline
                    maxRows={6}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Message U-Probe Assistant..."
                    disabled={isLoading}
                    variant="outlined"
                    sx={{
                      flex: 1,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        backgroundColor: '#ffffff',
                        fontSize: '0.9375rem',
                        paddingY: 0.75,
                        transition: 'all 0.15s ease',
                        '& fieldset': {
                          borderColor: '#cbd5e1'
                        },
                        '&:hover': {
                          '& fieldset': {
                            borderColor: '#94a3b8'
                          }
                        },
                        '&.Mui-focused': {
                          boxShadow: '0 0 0 2px rgba(37, 99, 235, 0.1)',
                          '& fieldset': {
                            borderColor: theme.palette.primary.main,
                            borderWidth: 1.5
                          }
                        }
                      }
                    }}
                  />
                  <Box sx={{ display: 'flex', gap: 0.75 }}>
                    <Tooltip title="Attach">
                      <IconButton
                        size="medium"
                        disabled={isLoading}
                        sx={{
                          width: 40,
                          height: 40,
                          color: '#64748b',
                          backgroundColor: '#ffffff',
                          border: '1px solid #cbd5e1',
                          borderRadius: 1.5,
                          transition: 'all 0.15s ease',
                          '&:hover': {
                            backgroundColor: 'rgba(37, 99, 235, 0.06)',
                            borderColor: theme.palette.primary.main,
                            color: theme.palette.primary.main
                          },
                          '&:disabled': {
                            color: '#cbd5e1',
                            backgroundColor: '#f8fafc'
                          }
                        }}
                        onClick={handleChooseFiles}
                      >
                        <Attachment fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <input ref={fileInputRef} type="file" style={{ display: 'none' }} multiple onChange={handleFilesSelected} />
                    <Button
                      variant="contained"
                      onClick={handleSendMessage}
                      disabled={!inputValue.trim() || isLoading}
                      sx={{
                        minWidth: 40,
                        width: 40,
                        height: 40,
                        borderRadius: 1.5,
                        background: 'linear-gradient(135deg, #2563eb 0%, #0891b2 100%)',
                        boxShadow: 'none',
                        transition: 'all 0.15s ease',
                        '&:hover': {
                          boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)'
                        },
                        '&:disabled': {
                          background: '#e2e8f0',
                          color: '#94a3b8'
                        }
                      }}
                    >
                      <Send fontSize="small" />
                    </Button>
                  </Box>
                </Box>
              </Box>
          </Box>
      </Box>
      {/* API Key Configuration Dialog */}
      <Dialog
        open={showApiKeyDialog}
        onClose={() => setShowApiKeyDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Settings />
            <Typography variant="h6">Agent Configuration</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="OpenAI API Key"
              type="password"
              fullWidth
              value={tempApiKey}
              onChange={(e) => setTempApiKey(e.target.value)}
              placeholder="sk-..."
              helperText="Your API Key will be securely stored in your local browser"
            />
            <TextField
              label="Model"
              fullWidth
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="gpt-4"
              helperText="Select the OpenAI model to use"
            />
            <TextField
              label="Proxy (Optional)"
              fullWidth
              value={proxy}
              onChange={(e) => setProxy(e.target.value)}
              placeholder="http://localhost:7890"
              helperText="Enter proxy address if needed"
            />
            <Alert severity="info">
              API Key will only be stored locally in your browser and will not be uploaded to the server. This configuration will be used each time you connect to the Agent.
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowApiKeyDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSaveApiKey}
            sx={{
              background: 'linear-gradient(135deg, #2563eb 0%, #0891b2 100%)'
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Agent;
