import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Avatar,
  IconButton,
  Card,
  CardContent,
  Chip,
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
  History,
  Delete,
  Settings,
  VpnKey,
  InsertDriveFile,
  Close,
  Download,
  Edit,
  Refresh,
  Search,
  Bookmark,
  BookmarkBorder,
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
  bookmarked?: boolean;
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
  bookmarked?: boolean;
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
        tags: conv.tags || [],
        bookmarked: conv.bookmarked || false
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
  const startSession = async () => {
    if (!apiKey) {
      setSnackbar({ open: true, message: 'Please set API Key first', severity: 'error' });
      setShowApiKeyDialog(true);
      return;
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

      // Attach sessionId to current conversation
      if (currentConversationId) {
        setConversations(prev => prev.map(conv => conv.id === currentConversationId ? { ...conv, sessionId: data.session_id } : conv));
      }
      setSnackbar({ open: true, message: 'Agent session started', severity: 'success' });
    } catch (e) {
      console.error(e);
      setSnackbar({ open: true, message: 'Failed to start session', severity: 'error' });
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
    try {
      const res = await fetch(`${API_BASE_URL}/agent/rewind`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: activeSessionId, user_turn_index: userTurnIndex, content: newContent, attachment_ids: attachmentIds })
      });
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
      setConversations(prev => prev.map(conv => {
        if (conv.id === currentConversationId) {
          const msgIndex = conv.messages.findIndex(m => m.id === message.id);
          if (msgIndex === -1) return conv;
          const updatedUser = { ...conv.messages[msgIndex], content: newContent };
          const truncated = [...conv.messages.slice(0, msgIndex), updatedUser];
          return { ...conv, messages: [...truncated, assistantMessage], updatedAt: new Date() };
        }
        return conv;
      }));
      setEditingMessageId(null);
      setEditValue('');
    } catch (error) {
      console.error('Failed to rewind message:', error);
      setSnackbar({ open: true, message: 'Failed to re-execute', severity: 'error' });
    } finally {
      setIsLoading(false);
      setIsReplaying(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    // Check session
    const activeSessionId = sessionId || (currentConversationId ? conversations.find(c => c.id === currentConversationId)?.sessionId : null);
    if (!activeSessionId) {
      setSnackbar({ open: true, message: 'Please start agent session first', severity: 'warning' });
      return;
    }

    // Create new conversation if none exists
    let conversationId = currentConversationId;
    if (!conversationId) {
      const newConversation: Conversation = {
        id: Date.now().toString(),
        title: 'New Conversation',
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        sessionId: activeSessionId,
        attachments: []
      };
      setConversations(prev => [newConversation, ...prev]);
      conversationId = newConversation.id;
      setCurrentConversationId(conversationId);
    }

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
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
      const res = await fetch(`${API_BASE_URL}/agent/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: activeSessionId, content: userMessage.content, attachment_ids: attachmentIds }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
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
      const isTimeout = error instanceof DOMException && error.name === 'AbortError';
      if (isTimeout) {
        setSnackbar({ open: true, message: 'Request timed out', severity: 'warning' });
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
      setIsLoading(false);
    }
  };

  const handleChooseFiles = () => {
    if (!sessionId) {
      setSnackbar({ open: true, message: 'Please start agent session first', severity: 'warning' });
      return;
    }
    // Ensure a conversation exists before selecting files
    if (!currentConversationId) {
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
    }
    fileInputRef.current?.click();
  };

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !sessionId) return;
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
    for (const file of Array.from(files)) {
      const fileId = `${Date.now()}-${Math.random()}`;
      setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));
      const form = new FormData();
      form.append('session_id', sessionId);
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

  const handleClearChat = () => {
    if (currentConversationId) {
      setConversations(prev => prev.map(conv => 
        conv.id === currentConversationId 
          ? { ...conv, messages: [], updatedAt: new Date() }
          : conv
      ));
    }
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
    try {
      const res = await fetch(`${API_BASE_URL}/agent/rewind`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: activeSessionId, user_turn_index: userTurnIndex, content: previousMessage.content, attachment_ids: attachmentIds })
      });
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
          const truncated = conv.messages.slice(0, messageIndex);
          return { ...conv, messages: [...truncated, newAssistantMessage], updatedAt: new Date() };
        }
        return conv;
      }));
    } catch (error) {
      console.error('Failed to regenerate:', error);
      setSnackbar({ open: true, message: 'Failed to regenerate', severity: 'error' });
    } finally {
      setIsLoading(false);
      setIsReplaying(false);
    }
  };
  const toggleBookmarkMessage = (messageId: string) => {
    if (!currentConversationId) return;
    setConversations(prev => prev.map(conv => {
      if (conv.id === currentConversationId) {
        return {
          ...conv,
          messages: conv.messages.map(msg => 
            msg.id === messageId ? { ...msg, bookmarked: !msg.bookmarked } : msg
          ),
          updatedAt: new Date()
        };
      }
      return conv;
    }));
  };
  const toggleBookmarkConversation = (conversationId: string) => {
    setConversations(prev => prev.map(conv => 
      conv.id === conversationId ? { ...conv, bookmarked: !conv.bookmarked } : conv
    ));
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
    if (!sessionId) {
      setSnackbar({ open: true, message: 'Please start a session first', severity: 'warning' });
      return;
    }
    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;
    let convId = currentConversationId;
    if (!convId) {
      const newConversation: Conversation = {
        id: Date.now().toString(),
        title: 'New Conversation',
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        sessionId: sessionId || undefined,
        attachments: [],
        tags: [],
        bookmarked: false
      };
      setConversations(prev => [newConversation, ...prev]);
      setCurrentConversationId(newConversation.id);
      convId = newConversation.id;
    }
    for (const file of files) {
      const fileId = `${Date.now()}-${Math.random()}`;
      setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));
      const form = new FormData();
      form.append('session_id', sessionId);
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
  }, [sessionId, currentConversationId, conversations]);
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
  };

  const renderMessage = (message: Message) => {
    const isUser = message.sender === 'user';
    const isEditing = isUser && editingMessageId === message.id;

    const renderContentWithCodeBlocks = (content: string) => {
      // Simple parser for triple backtick code blocks
      const parts: React.ReactNode[] = [];
      const regex = /```(\w+)?\n([\s\S]*?)```/g;
      let lastIndex = 0;
      let match: RegExpExecArray | null;
      const linkify = (text: string) => {
        const nodes: React.ReactNode[] = [];
        const urlRe = /((https?:\/\/[^\s]+)|((?:\/)agent\/(?:files|uploads)\/[^\s]+))/g;
        let idx = 0;
        let m: RegExpExecArray | null;
        while ((m = urlRe.exec(text)) !== null) {
          if (m.index > idx) {
            nodes.push(<span key={`lt-${idx}`}>{text.slice(idx, m.index)}</span>);
          }
          const url = m[0];
          nodes.push(
            <a key={`a-${m.index}`} href={url} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'underline' }}>
              {url}
            </a>
          );
          idx = urlRe.lastIndex;
        }
        if (idx < text.length) nodes.push(<span key={`lt-end`}>{text.slice(idx)}</span>);
        return nodes;
      };
      while ((match = regex.exec(content)) !== null) {
        if (match.index > lastIndex) {
          const text = content.slice(lastIndex, match.index);
          parts.push(<span key={`t-${lastIndex}`}>{linkify(text)}</span>);
        }
        const lang = (match[1] || '').toLowerCase();
        const code = match[2];
        parts.push(
          <Box key={`c-${match.index}`} sx={{ mt: 1, mb: 1 }}>
            <Paper variant="outlined" sx={{ p: 1.5, backgroundColor: '#0b1020', color: '#eaeefb', overflowX: 'auto' }}>
              <Typography variant="caption" sx={{ color: '#9fb3ff' }}>{lang || 'code'}</Typography>
              <pre style={{ margin: 0 }}><code>{code}</code></pre>
            </Paper>
          </Box>
        );
        lastIndex = regex.lastIndex;
      }
      if (lastIndex < content.length) {
        const text = content.slice(lastIndex);
        parts.push(<span key={`t-end`}>{linkify(text)}</span>);
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
            mb: 3,
            flexDirection: isUser ? 'row-reverse' : 'row',
            alignItems: 'flex-start'
          }}
        >
          <Avatar
            sx={{
              bgcolor: isUser ? theme.palette.primary.main : theme.palette.secondary.main,
              mx: 2,
              width: 36,
              height: 36
            }}
          >
            {isUser ? <Person /> : <SmartToy />}
          </Avatar>
          <Paper
            elevation={0}
            sx={{
              maxWidth: '70%',
              p: 2.5,
              ...(isUser
                ? { 
                    background: 'linear-gradient(135deg, #2563eb 0%, #0891b2 100%)',
                    boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)'
                  }
                : { 
                    background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                    boxShadow: '0 2px 12px rgba(148, 163, 184, 0.1)'
                  }
              ),
              color: isUser ? 'white' : 'text.primary',
              borderRadius: isUser ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
              border: isUser ? 'none' : '1px solid rgba(226, 232, 240, 0.8)',
              position: 'relative',
              '&::before': isUser ? {
                content: '""',
                position: 'absolute',
                bottom: 0,
                right: -8,
                width: 0,
                height: 0,
                borderLeft: '8px solid transparent',
                borderRight: '8px solid transparent',
                borderTop: `8px solid ${theme.palette.primary.main}`,
                transform: 'rotate(45deg)',
                transformOrigin: 'center'
              } : {
                content: '""',
                position: 'absolute',
                bottom: 0,
                left: -8,
                width: 0,
                height: 0,
                borderLeft: '8px solid transparent',
                borderRight: '8px solid transparent',
                borderTop: '8px solid #ffffff',
                transform: 'rotate(-45deg)',
                transformOrigin: 'center'
              }
            }}
          >
            {isEditing ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <TextField
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  multiline
                  minRows={2}
                  maxRows={6}
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'rgba(255, 255, 255, 0.15)',
                      color: 'white',
                      '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                      '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.6)' },
                      '&.Mui-focused fieldset': { borderColor: 'rgba(255, 255, 255, 0.8)' }
                    }
                  }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={handleEditCancel}
                    sx={{
                      color: 'white',
                      borderColor: 'rgba(255, 255, 255, 0.4)',
                      '&:hover': { borderColor: 'white', backgroundColor: 'rgba(255, 255, 255, 0.1)' }
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => handleEditSave(message)}
                    disabled={isLoading || isReplaying}
                    sx={{
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      color: theme.palette.primary.main,
                      '&:hover': { backgroundColor: 'white' }
                    }}
                  >
                    Save & Run
                  </Button>
                </Box>
              </Box>
            ) : (
              <Typography
                variant="body1"
                component="div"
                sx={{
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                  fontSize: '0.95rem',
                  fontFamily: message.sender === 'assistant' ? 'inherit' : 'inherit',
                  '& p': {
                    margin: '0.5em 0'
                  }
                }}
              >
                {renderContentWithCodeBlocks(combinedContent)}
              </Typography>
            )}
            {!isUser && (
              <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                <Tooltip title="Copy Content">
                  <IconButton
                    size="small"
                    sx={{ color: 'text.secondary' }}
                    onClick={() => {
                      navigator.clipboard.writeText(combinedContent);
                      setSnackbar({ open: true, message: 'Copied to clipboard', severity: 'success' });
                    }}
                  >
                    <ContentCopy fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Regenerate">
                  <IconButton
                    size="small"
                    sx={{ color: 'text.secondary' }}
                    onClick={() => handleRegenerateMessage(message.id)}
                    disabled={isLoading}
                  >
                    <Refresh fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title={message.bookmarked ? "Unbookmark" : "Bookmark"}>
                  <IconButton
                    size="small"
                    sx={{ color: 'text.secondary' }}
                    onClick={() => toggleBookmarkMessage(message.id)}
                  >
                    {message.bookmarked ? <Bookmark fontSize="small" /> : <BookmarkBorder fontSize="small" />}
                  </IconButton>
                </Tooltip>
              </Box>
            )}
            {isUser && !isEditing && (
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                <Tooltip title="Edit Message">
                  <IconButton
                    size="small"
                    sx={{ color: 'rgba(255, 255, 255, 0.9)' }}
                    onClick={() => handleEditStart(message)}
                  >
                    <Edit fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title={message.bookmarked ? "Unbookmark" : "Bookmark"}>
                  <IconButton
                    size="small"
                    sx={{ color: 'rgba(255, 255, 255, 0.9)' }}
                    onClick={() => toggleBookmarkMessage(message.id)}
                  >
                    {message.bookmarked ? <Bookmark fontSize="small" /> : <BookmarkBorder fontSize="small" />}
                  </IconButton>
                </Tooltip>
              </Box>
            )}
            {/* Attachments in message bubble */}
            {isUser && message.attachments && message.attachments.length > 0 && (
              <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(255, 255, 255, 0.2)' }}>
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.8)', mb: 1, display: 'block', fontWeight: 600 }}>
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
                        backgroundColor: 'rgba(255, 255, 255, 0.15)',
                        transition: 'all 0.2s',
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: 'rgba(255, 255, 255, 0.25)'
                        }
                      }}
                      onClick={() => window.open(att.url, '_blank')}
                    >
                      <InsertDriveFile sx={{ fontSize: 16, color: 'white', mr: 1, opacity: 0.9 }} />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            color: 'white',
                            fontWeight: 500,
                            display: 'block',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {att.filename}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.7rem' }}>
                          {(att.size / 1024).toFixed(1)} KB
                        </Typography>
                      </Box>
                      <Download sx={{ fontSize: 16, color: 'white', opacity: 0.8 }} />
                    </Box>
                  ))}
                </Box>
              </Box>
            )}
          </Paper>
        </Box>
      </Fade>
    );
  };

  return (
    <Box sx={{
      minHeight: 'calc(100vh - 64px)',
      display: 'flex',
      backgroundColor: '#ffffff',
      pt: 2,
      pb: 2
    }}>
      <Box sx={{ width: '100%', display: 'flex', maxWidth: '1400px', mx: 'auto', height: 'calc(100vh - 96px)' }}>
          {/* Left Sidebar - Conversation History */}
          {!isMobile && !sidebarCollapsed && (
            <Box
              sx={{
                width: '320px',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderRight: '1px solid rgba(226, 232, 240, 0.6)',
                backgroundColor: '#f8fafc'
              }}
            >
                {/* Header */}
                <Box sx={{ p: 3, borderBottom: '1px solid rgba(226, 232, 240, 0.6)', backgroundColor: '#ffffff' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <History sx={{ mr: 1, color: theme.palette.primary.main }} />
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Conversations
                      </Typography>
                    </Box>
                    <Tooltip title="Collapse Sidebar">
                      <IconButton size="small" onClick={() => setSidebarCollapsed(true)}>
                        <ChevronLeft />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  {showSearch && (
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Search conversations... (Ctrl+K)"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      sx={{ mb: 2 }}
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
                  )}
                  
                  <Button
                    variant="contained"
                    fullWidth
                    startIcon={<Add />}
                    onClick={createNewConversation}
                    sx={{
                      background: 'linear-gradient(135deg, #2563eb 0%, #0891b2 100%)',
                      borderRadius: 2,
                      mb: 1,
                      boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)',
                      '&:hover': {
                        boxShadow: '0 4px 12px rgba(37, 99, 235, 0.35)'
                      }
                    }}
                  >
                    New Chat
                  </Button>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    {sessionId ? (
                      <Button
                        variant="outlined"
                        fullWidth
                        startIcon={<VpnKey />}
                        onClick={stopSession}
                        color="error"
                        sx={{ borderRadius: 2 }}
                      >
                        End Session
                      </Button>
                    ) : (
                      <Button
                        variant="outlined"
                        fullWidth
                        startIcon={<VpnKey />}
                        onClick={startSession}
                        sx={{ borderRadius: 2 }}
                      >
                        Start Session
                      </Button>
                    )}
                    <Tooltip title="Settings">
                      <IconButton
                        onClick={() => setShowApiKeyDialog(true)}
                        sx={{ border: '1px solid rgba(226, 232, 240, 0.6)' }}
                      >
                        <Settings />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Search (Ctrl+K)">
                      <IconButton
                        onClick={() => setShowSearch(prev => !prev)}
                        sx={{ 
                          border: '1px solid rgba(226, 232, 240, 0.6)',
                          color: showSearch ? theme.palette.primary.main : 'inherit'
                        }}
                      >
                        <Search />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>

                {/* Conversation List */}
                <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
                  {filteredConversations.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        {searchQuery ? 'No matching conversations' : 'No conversations yet'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {searchQuery ? 'Try different keywords' : 'Start a new conversation'}
                      </Typography>
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {filteredConversations.map((conversation) => (
                        <Card
                          key={conversation.id}
                          elevation={0}
                          sx={{
                            cursor: 'pointer',
                            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                            border: currentConversationId === conversation.id ? 
                              `2px solid ${theme.palette.primary.main}` : 
                              '1px solid rgba(226, 232, 240, 0.5)',
                            backgroundColor: currentConversationId === conversation.id ?
                              'linear-gradient(135deg, rgba(37, 99, 235, 0.08) 0%, rgba(8, 145, 178, 0.05) 100%)' : '#ffffff',
                            borderRadius: 2.5,
                            '&:hover': {
                              transform: 'translateY(-2px)',
                              boxShadow: '0 4px 16px rgba(37, 99, 235, 0.15)',
                              borderColor: theme.palette.primary.main
                            }
                          }}
                          onClick={() => setCurrentConversationId(conversation.id)}
                        >
                          <CardContent sx={{ p: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                                  {conversation.bookmarked && (
                                    <Bookmark sx={{ fontSize: 14, color: theme.palette.primary.main }} />
                                  )}
                                  <Typography 
                                    variant="body2" 
                                    sx={{ 
                                      fontWeight: 600,
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap'
                                    }}
                                  >
                                    {conversation.title}
                                  </Typography>
                                </Box>
                                <Typography variant="caption" color="text.secondary">
                                  {conversation.updatedAt.toLocaleDateString()} · {conversation.messages.length} messages
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', gap: 0.5 }}>
                                <Tooltip title={conversation.bookmarked ? "Unbookmark" : "Bookmark"}>
                                  <IconButton
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleBookmarkConversation(conversation.id);
                                    }}
                                    sx={{ opacity: 0.7, '&:hover': { opacity: 1 } }}
                                  >
                                    {conversation.bookmarked ? <Bookmark fontSize="small" /> : <BookmarkBorder fontSize="small" />}
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Delete">
                                  <IconButton
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteConversation(conversation.id);
                                    }}
                                    sx={{ opacity: 0.7, '&:hover': { opacity: 1 } }}
                                  >
                                    <Delete fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </Box>
                          </CardContent>
                        </Card>
                      ))}
                    </Box>
                  )}
                </Box>

                {/* Suggested Prompts */}
                <Box sx={{ p: 2, borderTop: '1px solid rgba(226, 232, 240, 0.6)', backgroundColor: '#ffffff' }}>
                  <Typography variant="subtitle2" sx={{ mb: 1.5, color: 'text.secondary' }}>
                    Quick Starts
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {suggestedPrompts.slice(0, 2).map((prompt, index) => (
                      <Chip
                        key={index}
                        label={prompt.title}
                        variant="outlined"
                        size="small"
                        clickable
                        onClick={() => handleSuggestedPrompt(prompt.prompt)}
                        sx={{
                          justifyContent: 'flex-start',
                          borderColor: theme.palette.primary.main,
                          color: theme.palette.primary.main,
                          '&:hover': {
                            backgroundColor: 'rgba(37, 99, 235, 0.08)'
                          }
                        }}
                      />
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
                    backgroundColor: 'rgba(37, 99, 235, 0.08)',
                    border: `3px dashed ${theme.palette.primary.main}`,
                    borderRadius: 2,
                    zIndex: 1000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backdropFilter: 'blur(4px)'
                  }}
                >
                  <Box sx={{ textAlign: 'center' }}>
                    <Attachment sx={{ fontSize: 64, color: theme.palette.primary.main, mb: 2 }} />
                    <Typography variant="h6" sx={{ color: theme.palette.primary.main, fontWeight: 600 }}>
                      Drop files here to upload
                    </Typography>
                  </Box>
                </Box>
              )}
              {/* Chat Header */}
              <Box
                sx={{
                  p: 3,
                  borderBottom: '1px solid rgba(226, 232, 240, 0.6)',
                  backgroundColor: '#ffffff'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar
                      sx={{
                        bgcolor: theme.palette.secondary.main,
                        mr: 2,
                        width: 40,
                        height: 40
                      }}
                    >
                      <SmartToy />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        U-Probe Assistant
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        AI-powered intelligent probe design consultant
                      </Typography>
                    </Box>
                  </Box>
                  {currentConversationId && (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="Export Conversation">
                        <IconButton onClick={exportConversation}>
                          <FileDownload />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Clear Chat">
                        <IconButton onClick={handleClearChat}>
                          <RestartAlt />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  )}
                </Box>
              </Box>

                {/* Message List */}
              <Box
                sx={{
                  flex: 1,
                  p: 3,
                  overflowY: 'auto',
                  backgroundColor: '#f8fafc',
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
                    <Box>
                      <Avatar
                        sx={{
                          width: 64,
                          height: 64,
                          bgcolor: theme.palette.primary.main,
                          mx: 'auto',
                          mb: 2
                        }}
                      >
                        <SmartToy sx={{ fontSize: 32 }} />
                      </Avatar>
                      <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                        Hello! I'm your Probe Design Assistant
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 3 }} color="text.secondary">
                        I can help you design probes, optimize parameters, and answer questions
                      </Typography>
                      {isMobile && (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
                          {suggestedPrompts.slice(0, 2).map((prompt, index) => (
                            <Chip
                              key={index}
                              label={prompt.title}
                              variant="outlined"
                              clickable
                              onClick={() => handleSuggestedPrompt(prompt.prompt)}
                              sx={{ borderColor: theme.palette.primary.main }}
                            />
                          ))}
                        </Box>
                      )}
                    </Box>
                  </Box>
                ) : (
                  <>
                    {messages.map(renderMessage)}
                    {isLoading && (
                      <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 3 }}>
                        <Avatar
                          sx={{
                            bgcolor: theme.palette.secondary.main,
                            mx: 2,
                            width: 36,
                            height: 36
                          }}
                        >
                          <SmartToy />
                        </Avatar>
                        <Paper
                          elevation={1}
                          sx={{
                            p: 2.5,
                            backgroundColor: '#ffffff',
                            borderRadius: '18px 18px 18px 4px',
                            border: '1px solid rgba(226, 232, 240, 0.6)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2
                          }}
                        >
                          <CircularProgress size={16} />
                          <Typography variant="body2" color="text.secondary">
                            Analyzing your question...
                          </Typography>
                        </Paper>
                      </Box>
                    )}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </Box>

              {/* Input Area */}
              <Box
                sx={{
                  p: 3,
                  borderTop: '1px solid rgba(226, 232, 240, 0.6)',
                  backgroundColor: '#ffffff'
                }}
              >
                {/* Attachments Display - Modern Card Style */}
                {currentAttachments.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', mb: 1, display: 'block', fontWeight: 600 }}>
                      Attached Files ({currentAttachments.length})
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                      {currentAttachments.map(att => (
                        <Card 
                          key={att.id}
                          elevation={0}
                          sx={{ 
                            display: 'flex',
                            alignItems: 'center',
                            p: 1.5,
                            pr: 1,
                            border: '1px solid rgba(37, 99, 235, 0.2)',
                            borderRadius: 2,
                            backgroundColor: 'rgba(37, 99, 235, 0.03)',
                            transition: 'all 0.2s',
                            '&:hover': {
                              borderColor: theme.palette.primary.main,
                              backgroundColor: 'rgba(37, 99, 235, 0.08)',
                              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.15)'
                            }
                          }}
                        >
                          <InsertDriveFile sx={{ fontSize: 20, color: theme.palette.primary.main, mr: 1 }} />
                          <Box sx={{ flex: 1, minWidth: 0, mr: 1 }}>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                fontWeight: 500,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                fontSize: '0.875rem'
                              }}
                            >
                              {att.filename}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {(att.size / 1024).toFixed(1)} KB
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <Tooltip title="Download">
                              <IconButton 
                                size="small" 
                                onClick={() => window.open(att.url, '_blank')}
                                sx={{ 
                                  color: 'text.secondary',
                                  '&:hover': { color: theme.palette.primary.main }
                                }}
                              >
                                <Download fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Remove">
                              <IconButton 
                                size="small" 
                                onClick={() => handleRemoveAttachment(att.id)}
                                sx={{ 
                                  color: 'text.secondary',
                                  '&:hover': { color: 'error.main' }
                                }}
                              >
                                <Close fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Card>
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

                <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
                  <TextField
                    ref={inputRef}
                    multiline
                    maxRows={4}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Describe your probe design requirements..."
                    disabled={isLoading}
                    variant="outlined"
                    sx={{
                      flex: 1,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 3,
                        backgroundColor: 'rgba(248, 250, 252, 0.8)',
                        '&:hover': {
                          backgroundColor: '#ffffff',
                        },
                        '&.Mui-focused': {
                          backgroundColor: '#ffffff',
                        }
                      }
                    }}
                  />
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Attach Files (drag & drop or click)">
                      <IconButton
                        size="large"
                        disabled={isLoading}
                        sx={{
                          border: '2px solid rgba(226, 232, 240, 0.6)',
                          borderRadius: 2,
                          transition: 'all 0.2s',
                          '&:hover': {
                            backgroundColor: 'rgba(37, 99, 235, 0.08)',
                            borderColor: theme.palette.primary.main,
                            transform: 'translateY(-2px)',
                            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)'
                          }
                        }}
                        onClick={handleChooseFiles}
                      >
                        <Attachment />
                      </IconButton>
                    </Tooltip>
                    <input ref={fileInputRef} type="file" style={{ display: 'none' }} multiple onChange={handleFilesSelected} />
                    <Button
                      variant="contained"
                      onClick={handleSendMessage}
                      disabled={!inputValue.trim() || isLoading}
                      sx={{
                        minWidth: 56,
                        height: 56,
                        borderRadius: 2,
                        background: 'linear-gradient(135deg, #2563eb 0%, #0891b2 100%)',
                        boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
                        transition: 'all 0.2s',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 6px 16px rgba(37, 99, 235, 0.4)'
                        },
                        '&:disabled': {
                          background: 'rgba(0, 0, 0, 0.12)'
                        }
                      }}
                    >
                      <Send />
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
