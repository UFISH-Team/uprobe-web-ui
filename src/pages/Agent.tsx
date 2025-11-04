import React, { useState, useRef, useEffect } from 'react';
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
} from '@mui/icons-material';
import { API_BASE_URL } from '../api';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  type?: 'text' | 'code' | 'result';
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
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
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLDivElement>(null);
  
  // WebSocket and API key management
  const [wsConnection, setWsConnection] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [tempApiKey, setTempApiKey] = useState('');
  const [model, setModel] = useState('gpt-4');
  const [proxy, setProxy] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' as 'success' | 'error' | 'info' | 'warning' });
  
  // Track the current assistant message being accumulated
  const currentAssistantMessageRef = useRef<string>('');

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
        }))
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
    } else {
      setMessages([]);
    }
  }, [currentConversationId, conversations]);

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

  // WebSocket connection management
  const connectWebSocket = () => {
    if (!apiKey) {
      setSnackbar({ open: true, message: 'Please set API Key first', severity: 'error' });
      setShowApiKeyDialog(true);
      return;
    }

    try {
      const wsUrl = API_BASE_URL.replace('http', 'ws') + '/agent/ws';
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('WebSocket connection established');
        // Send configuration as first message
        ws.send(JSON.stringify({
          api_key: apiKey,
          model: model,
          proxy: proxy || undefined
        }));
        setIsConnected(true);
        setSnackbar({ open: true, message: 'Agent connected', severity: 'success' });
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'status') {
            setSnackbar({ open: true, message: data.message, severity: 'info' });
          } else if (data.type === 'message') {
            const content = data.content;
            const isComplete = data.complete !== false; // Default to true if not specified
            
            if (isComplete) {
              // This is a complete message, add it as a new message bubble
              if (currentAssistantMessageRef.current) {
                // If there was accumulated content, append to it
                const fullContent = currentAssistantMessageRef.current + '\n' + content;
                currentAssistantMessageRef.current = '';
                
                const assistantMessage: Message = {
                  id: Date.now().toString(),
                  content: fullContent,
                  sender: 'assistant',
                  timestamp: new Date(),
                  type: 'text'
                };
                
                setConversations(prev => prev.map(conv => {
                  if (conv.id === currentConversationId) {
                    return { ...conv, messages: [...conv.messages, assistantMessage], updatedAt: new Date() };
                  }
                  return conv;
                }));
              } else {
                // Create new message with just this content
                const assistantMessage: Message = {
                  id: Date.now().toString(),
                  content: content,
                  sender: 'assistant',
                  timestamp: new Date(),
                  type: 'text'
                };
                
                setConversations(prev => prev.map(conv => {
                  if (conv.id === currentConversationId) {
                    return { ...conv, messages: [...conv.messages, assistantMessage], updatedAt: new Date() };
                  }
                  return conv;
                }));
              }
              setIsLoading(false);
            } else {
              // Accumulate the message
              if (currentAssistantMessageRef.current) {
                currentAssistantMessageRef.current += '\n' + content;
              } else {
                currentAssistantMessageRef.current = content;
              }
            }
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setSnackbar({ open: true, message: 'WebSocket connection error', severity: 'error' });
        setIsConnected(false);
      };

      ws.onclose = () => {
        console.log('WebSocket connection closed');
        setIsConnected(false);
        setSnackbar({ open: true, message: 'Agent disconnected', severity: 'info' });
      };

      setWsConnection(ws);
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      setSnackbar({ open: true, message: 'Connection failed', severity: 'error' });
    }
  };

  const disconnectWebSocket = () => {
    if (wsConnection) {
      wsConnection.close();
      setWsConnection(null);
      setIsConnected(false);
      currentAssistantMessageRef.current = ''; // Clear any accumulated messages
    }
  };

  // Cleanup WebSocket on unmount
  useEffect(() => {
    return () => {
      disconnectWebSocket();
    };
  }, []);

  const createNewConversation = () => {
    const newConversation: Conversation = {
      id: Date.now().toString(),
      title: 'New Conversation',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    setConversations(prev => [newConversation, ...prev]);
    setCurrentConversationId(newConversation.id);
  };

  const deleteConversation = (conversationId: string) => {
    setConversations(prev => prev.filter(c => c.id !== conversationId));
    if (currentConversationId === conversationId) {
      setCurrentConversationId(null);
    }
  };


  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    // Check if connected
    if (!isConnected || !wsConnection) {
      setSnackbar({ open: true, message: 'Please connect Agent first', severity: 'warning' });
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
        updatedAt: new Date()
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
      type: 'text'
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

    // Send message via WebSocket
    try {
      wsConnection.send(JSON.stringify({
        type: 'message',
        content: userMessage.content
      }));
    } catch (error) {
      console.error('Failed to send message:', error);
      setSnackbar({ open: true, message: 'Failed to send message', severity: 'error' });
      setIsLoading(false);
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

    // Disconnect existing connection if any
    if (isConnected) {
      disconnectWebSocket();
    }
  };

  const renderMessage = (message: Message) => {
    const isUser = message.sender === 'user';
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
            elevation={1}
            sx={{
              maxWidth: '70%',
              p: 2.5,
              backgroundColor: isUser ? theme.palette.primary.main : '#ffffff',
              color: isUser ? 'white' : 'text.primary',
              borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              border: isUser ? 'none' : '1px solid rgba(226, 232, 240, 0.6)',
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
              {message.content.split('\n').map((line, index) => (
                <React.Fragment key={index}>
                  {line}
                  {index < message.content.split('\n').length - 1 && <br />}
                </React.Fragment>
              ))}
            </Typography>
            {!isUser && (
              <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                <Tooltip title="Copy Content">
                  <IconButton
                    size="small"
                    sx={{ color: 'text.secondary' }}
                    onClick={() => navigator.clipboard.writeText(message.content)}
                  >
                    <ContentCopy fontSize="small" />
                  </IconButton>
                </Tooltip>
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
          {!isMobile && (
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
                  </Box>
                  
                  <Button
                    variant="contained"
                    fullWidth
                    startIcon={<Add />}
                    onClick={createNewConversation}
                    sx={{
                      background: 'linear-gradient(135deg, #2563eb 0%, #0891b2 100%)',
                      borderRadius: 2,
                      mb: 1
                    }}
                  >
                    New Chat
                  </Button>

                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {isConnected ? (
                      <Button
                        variant="outlined"
                        fullWidth
                        startIcon={<VpnKey />}
                        onClick={disconnectWebSocket}
                        color="error"
                        sx={{ borderRadius: 2 }}
                      >
                        Disconnect
                      </Button>
                    ) : (
                      <Button
                        variant="outlined"
                        fullWidth
                        startIcon={<VpnKey />}
                        onClick={connectWebSocket}
                        sx={{ borderRadius: 2 }}
                      >
                        Connect Agent
                      </Button>
                    )}
                    <IconButton
                      onClick={() => setShowApiKeyDialog(true)}
                      sx={{ border: '1px solid rgba(226, 232, 240, 0.6)' }}
                    >
                      <Settings />
                    </IconButton>
                  </Box>
                </Box>

                {/* Conversation List */}
                <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
                  {conversations.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        No conversations yet
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Start a new conversation to begin
                      </Typography>
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {conversations.map((conversation) => (
                        <Card
                          key={conversation.id}
                          sx={{
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            border: currentConversationId === conversation.id ? 
                              `2px solid ${theme.palette.primary.main}` : 
                              '1px solid rgba(226, 232, 240, 0.6)',
                            backgroundColor: currentConversationId === conversation.id ?
                              'rgba(37, 99, 235, 0.05)' : 'transparent',
                            '&:hover': {
                              transform: 'translateY(-1px)',
                              boxShadow: theme.shadows[1],
                              borderColor: theme.palette.primary.main
                            }
                          }}
                          onClick={() => setCurrentConversationId(conversation.id)}
                        >
                          <CardContent sx={{ p: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography 
                                  variant="body2" 
                                  sx={{ 
                                    fontWeight: 600,
                                    mb: 0.5,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                  }}
                                >
                                  {conversation.title}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {conversation.updatedAt.toLocaleDateString()}
                                </Typography>
                              </Box>
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteConversation(conversation.id);
                                }}
                                sx={{ ml: 1, opacity: 0.7, '&:hover': { opacity: 1 } }}
                              >
                                <Delete fontSize="small" />
                              </IconButton>
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

          {/* Main Chat Area */}
          <Box
            sx={{
              flex: 1,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: '#ffffff'
            }}
          >
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
                  {isMobile && (
                    <IconButton onClick={handleClearChat}>
                      <RestartAlt />
                    </IconButton>
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
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
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
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Tooltip title="Attachment">
                      <IconButton
                        size="medium"
                        sx={{
                          border: '1px solid rgba(226, 232, 240, 0.6)',
                          '&:hover': {
                            backgroundColor: theme.palette.primary.main,
                            color: 'white'
                          }
                        }}
                      >
                        <Attachment />
                      </IconButton>
                    </Tooltip>
                    <Button
                      variant="contained"
                      onClick={handleSendMessage}
                      disabled={!inputValue.trim() || isLoading}
                      sx={{
                        minWidth: 48,
                        height: 48,
                        borderRadius: 3,
                        background: 'linear-gradient(135deg, #2563eb 0%, #0891b2 100%)'
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
