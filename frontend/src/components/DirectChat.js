import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader } from './ui/card'; // CardTitle not used
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from './ui/dropdown-menu';
import { 
  ArrowLeft, 
  Send, 
  Clock, 
  MoreVertical, 
  Trash2,
  Paperclip,
  X
  // Circle // Not using Circle for status indicator here directly, relies on color
} from 'lucide-react';
import { USER_STATUS as MOCK_USER_STATUS } from '../data/mock'; // Renamed for clarity
import FileUpload, { FileMessage } from './FileUpload';

const DirectChat = ({ selectedEmployee, onBack }) => {
  const { user, sendWebSocketMessage, webSocketRef, userStatuses } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showFileUpload, setShowFileUpload] = useState(false);
  const messagesEndRef = useRef(null);

  const recipientId = selectedEmployee && selectedEmployee["Email ID"]; // Get recipient's ID

  // WebSocket message handling for direct messages
  useEffect(() => {
    if (webSocketRef && webSocketRef.current && user && recipientId) {
      const ws = webSocketRef.current;
      const handleMessage = (event) => {
        try {
          const incomingMessage = JSON.parse(event.data);
          console.log("DirectChat received WS message:", incomingMessage);

          if (incomingMessage.type === 'chat_message') {
            // Check if the message is part of this direct chat
            const isFromSenderToRecipient = incomingMessage.sender_id === user.id && incomingMessage.recipient_id === recipientId;
            const isFromRecipientToSender = incomingMessage.sender_id === recipientId && incomingMessage.recipient_id === user.id;

            if (isFromSenderToRecipient || isFromRecipientToSender) {
              setMessages(prevMessages => {
                // Avoid duplicate messages if server echoes back
                if (prevMessages.find(msg => msg.id === incomingMessage.id)) {
                  return prevMessages;
                }
                return [...prevMessages, incomingMessage];
              });
            }
          }
          // Status updates are handled by AuthContext and reflected via userStatuses prop
        } catch (error) {
          console.error('Error processing WebSocket message in DirectChat:', error);
        }
      };

      ws.addEventListener('message', handleMessage);
      return () => {
        ws.removeEventListener('message', handleMessage);
      };
    }
  }, [webSocketRef, user, recipientId]);


  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);


  const handleSendMessage = () => {
    if (newMessage.trim() && user && recipientId) {
      const messagePayload = {
        type: 'chat_message',
        recipient_id: recipientId,
        sender_id: user.id,
        sender_name: user.name,
        content: newMessage,
        // timestamp and id will be added by backend
      };
      sendWebSocketMessage(messagePayload);
      // Optimistically add message (optional, server should echo it back)
      // const optimisticMessage = {
      //   ...messagePayload,
      //   id: `temp-${Date.now()}`, // Temporary ID
      //   timestamp: new Date().toISOString(),
      // };
      // setMessages(prevMessages => [...prevMessages, optimisticMessage]);
      setNewMessage('');
    }
  };

  // TODO: Implement message deletion with backend if needed
  const handleDeleteMessage = (messageId) => {
    console.log(`Request to delete direct message ${messageId}. (Not implemented with backend)`);
    setMessages(messages.map(msg => 
      msg.id === messageId 
        ? { ...msg, deleted: true, content: 'This message was deleted' } // Optimistic update
        : msg
    ));
    // Example: sendWebSocketMessage({ type: 'delete_message', message_id: messageId, context: 'direct' });
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = useCallback((statusKey) => {
    const statusMap = {
      [MOCK_USER_STATUS.ONLINE]: 'text-green-500',
      [MOCK_USER_STATUS.BUSY]: 'text-red-500',
      [MOCK_USER_STATUS.OFFLINE]: 'text-gray-400',
    };
    return statusMap[statusKey] || 'text-gray-400';
  }, []);

  const getStatusText = useCallback((statusKey) => {
    const statusTextMap = {
      [MOCK_USER_STATUS.ONLINE]: 'Online',
      [MOCK_USER_STATUS.BUSY]: 'Busy',
      [MOCK_USER_STATUS.OFFLINE]: 'Offline',
    };
    return statusTextMap[statusKey] || 'Unknown';
  }, []);

  const employeeStatus = recipientId ? (userStatuses[recipientId] || MOCK_USER_STATUS.OFFLINE) : MOCK_USER_STATUS.OFFLINE;

  if (!selectedEmployee) {
    return <div className="p-4">No employee selected for direct chat.</div>;
  }
  if (!user) {
     return <div className="p-4">Please log in to chat.</div>;
  }

  return (
    <Card className="h-[calc(100vh-200px)] min-h-[600px] overflow-hidden bg-white/80 backdrop-blur-sm border-0 shadow-xl">
      <CardHeader className="p-4 border-b border-gray-200 bg-white/90">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="p-1"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="relative">
              <Avatar className="w-10 h-10">
                <AvatarFallback className="bg-[#225F8B] text-white">
                  {selectedEmployee.Name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className={`absolute -bottom-0 -right-0 w-3 h-3 border-2 border-white rounded-full ${
                employeeStatus === MOCK_USER_STATUS.ONLINE ? 'bg-green-500' :
                employeeStatus === MOCK_USER_STATUS.BUSY ? 'bg-red-500' : 'bg-gray-400'
              }`}></div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{selectedEmployee.Name}</h3>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span>{selectedEmployee.Designation}</span>
                <span aria-hidden="true">•</span>
                <span>{selectedEmployee.Department}</span>
                <span className={`text-xs ${getStatusColor(employeeStatus)}`}>
                  <span aria-hidden="true">•</span> {getStatusText(employeeStatus)}
                </span>
              </div>
            </div>
          </div>
          <Badge variant="outline" className="text-xs bg-[#225F8B]/10 text-[#225F8B]">
            Direct Message
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-0 flex flex-col h-[calc(100%-73px)]"> {/* Adjust height considering header */}
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <p>Start a conversation with {selectedEmployee.Name}.</p>
                <p className="text-xs">Messages are end-to-end NOT encrypted (this is a demo).</p>
              </div>
            ) : (
              messages.map((message) => (
                <div key={message.id || message.timestamp} className="flex items-start space-x-3"> {/* Use timestamp as fallback key if id is missing */}
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-[#225F8B] text-white text-xs">
                      {message.sender_name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-sm text-gray-900">
                          {message.sender_name}
                        </span>
                        <span className="text-xs text-gray-500 flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatTime(message.timestamp)}
                        </span>
                      </div>
                      {message.sender_id === user.id && !message.deleted && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <MoreVertical className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={() => handleDeleteMessage(message.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3 mr-2" />
                              Delete Message (local)
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                    <p className={`text-sm ${message.deleted ? 'text-gray-400 italic' : 'text-gray-700'}`}>
                      {message.content}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 bg-white/90">
          <div className="flex items-center space-x-2">
            <Input
              placeholder={`Message ${selectedEmployee.Name}`}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              className="flex-1"
              disabled={!user || !recipientId}
            />
            <Button 
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || !user || !recipientId}
              className="bg-[#225F8B] hover:bg-[#225F8B]/90"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DirectChat;