import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
// import { Separator } from './ui/separator'; // Not used
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from './ui/dropdown-menu';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'; // Not used
import { 
  Hash, 
  Users, 
  Search, 
  Send, 
  // Plus, // Not used
  Settings, 
  MessageSquare,
  Clock,
  UserPlus,
  Building,
  ChevronRight,
  // Dot, // Not used
  Trash2,
  MoreVertical,
  Circle
} from 'lucide-react';
import {
  COMMUNICATION_CHANNELS,
  // MOCK_MESSAGES, // To be replaced by WebSocket messages
  getAllEmployees, // This might still be used for directory, or fetched from API
  DEPARTMENT_DATA, // This might still be used for directory, or fetched from API
  USER_STATUS as MOCK_USER_STATUS // Keep for "busy" status, online/offline from AuthContext
} from '../data/mock';
import DirectChat from './DirectChat';

const InternalCommunication = () => {
  const { user, sendWebSocketMessage, webSocketRef, userStatuses } = useAuth();
  const [selectedChannel, setSelectedChannel] = useState(COMMUNICATION_CHANNELS[0]);
  const [messages, setMessages] = useState([]); // Messages will come from WebSocket
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('channels');
  // const [userStatus, setUserStatusState] = useState(MOCK_USER_STATUS.ONLINE); // Current user's status, primarily for "busy"
  const [allEmployeesList, setAllEmployeesList] = useState([]); // For people tab
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [viewMode, setViewMode] = useState('channels'); // 'channels' or 'directChat'
  const messagesEndRef = useRef(null);

  // Fetch initial employee list (mock for now)
  useEffect(() => {
    setAllEmployeesList(getAllEmployees());
  }, []);

  // Current user's status from AuthContext, default to 'offline' if not found
  const currentUserStatus = userStatuses[user?.id] || MOCK_USER_STATUS.OFFLINE;


  // WebSocket message handling
  useEffect(() => {
    if (webSocketRef && webSocketRef.current) {
      const ws = webSocketRef.current;
      const handleMessage = (event) => {
        try {
          const incomingMessage = JSON.parse(event.data);
          console.log("InternalCommunication received WS message:", incomingMessage);

          if (incomingMessage.type === 'chat_message') {
            // Add to messages if it's for the current channel or a general broadcast
            // Or if it's a message this user sent (confirmation from server)
            if (incomingMessage.channel_id === selectedChannel.id ||
                (incomingMessage.sender_id === user.id && !incomingMessage.channel_id && !incomingMessage.recipient_id) || // General broadcast by self
                (incomingMessage.sender_id === user.id && incomingMessage.channel_id === selectedChannel.id) // Own message in current channel
            ) {
              setMessages(prevMessages => [...prevMessages, incomingMessage]);
            }
          } else if (incomingMessage.type === 'status_update') {
            // Status updates are handled by AuthContext, but we might want to refresh lists
            // For example, re-fetch or re-filter employee list if statuses change UI directly here
            // For now, AuthContext handles global status state (userStatuses)
          }
          // Add other message type handlers if needed
        } catch (error) {
          console.error('Error processing WebSocket message in InternalCommunication:', error);
        }
      };

      ws.addEventListener('message', handleMessage);
      return () => {
        ws.removeEventListener('message', handleMessage);
      };
    }
  }, [webSocketRef, user?.id, selectedChannel?.id]);


  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // TODO: Implement message deletion with backend if needed
  const handleDeleteMessages = () => {
    // This would require a backend call to delete messages for a channel
    console.log(`Request to delete all messages in #${selectedChannel.name}. (Not implemented with backend)`);
    setMessages(prevMessages => prevMessages.filter(msg => msg.channel_id !== selectedChannel.id));
  };

  const handleDeleteMessage = (messageId) => {
    // This would require a backend call to mark a message as deleted
    console.log(`Request to delete message ${messageId}. (Not implemented with backend)`);
    setMessages(messages.map(msg => 
      msg.id === messageId 
        ? { ...msg, deleted: true, content: 'This message was deleted' } // Optimistic update
        : msg
    ));
    // Example: sendWebSocketMessage({ type: 'delete_message', message_id: messageId });
  };

  const handleEmployeeClick = (employee) => {
    setSelectedEmployee(employee); // employee object should have an 'id' or 'Email ID'
    setViewMode('directChat');
  };

  const handleBackToChannels = () => {
    setViewMode('channels');
    setSelectedEmployee(null);
  };

  const handleSetBusyStatus = () => {
    if (user && user.id) {
      const newStatus = currentUserStatus === MOCK_USER_STATUS.BUSY ? MOCK_USER_STATUS.ONLINE : MOCK_USER_STATUS.BUSY;
      // setUserStatusState(newStatus); // Local state for busy
      sendWebSocketMessage({
        type: 'set_status',
        user_id: user.id,
        status: newStatus,
      });
    }
  };

  const getStatusColor = useCallback((statusKey) => {
    // statusKey is like "online", "offline", "busy"
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


  const handleSendMessage = () => {
    if (newMessage.trim() && user && selectedChannel) {
      const messagePayload = {
        type: 'chat_message',
        channel_id: selectedChannel.id,
        sender_id: user.id, // Use user.id from AuthContext
        sender_name: user.name,
        content: newMessage,
        // timestamp will be added by backend
      };
      sendWebSocketMessage(messagePayload);
      // Optimistic update (optional, server should echo back the message)
      // setMessages(prev => [...prev, {...messagePayload, id: Date.now().toString(), timestamp: new Date().toISOString()}]);
      setNewMessage('');
    }
  };

  const getChannelMessages = () => {
    // Filter messages for the currently selected channel
    return messages.filter(msg => msg.channel_id === selectedChannel.id);
  };

  const getFilteredChannels = () => {
    return COMMUNICATION_CHANNELS.filter(channel =>
      channel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (channel.description && channel.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  };

  // This uses mock data. Ideally, employee list with statuses comes from backend or AuthContext.userStatuses
  const getEmployeesForPeopleTab = () => {
    return allEmployeesList.map(emp => ({
      ...emp,
      // 'Email ID' is the key in mock data, ensure it matches user.id format if used for keys
      status: userStatuses[emp['Email ID']] || MOCK_USER_STATUS.OFFLINE
    }));
  };


  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getChannelIcon = (channel) => {
    if (!channel) return <Hash className="h-4 w-4" />;
    if (channel.type === 'public') return <Hash className="h-4 w-4" />;
    if (channel.type === 'department') return <Building className="h-4 w-4" />;
    return <Users className="h-4 w-4" />;
  };

  const renderSidebar = () => (
    <div className="w-80 bg-white/90 backdrop-blur-sm border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">ShowTime Chat</h2>
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                  <Circle className={`h-3 w-3 fill-current ${getStatusColor(currentUserStatus)}`} />
                  <span className="text-sm">{getStatusText(currentUserStatus)}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Set Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {/* Online/Offline is automatic via WebSocket connection */}
                {/* Allow setting Busy */}
                <DropdownMenuItem onClick={handleSetBusyStatus}>
                  <Circle className={`h-3 w-3 fill-current ${currentUserStatus === MOCK_USER_STATUS.BUSY ? getStatusColor(MOCK_USER_STATUS.ONLINE) : getStatusColor(MOCK_USER_STATUS.BUSY)} mr-2`} />
                  {currentUserStatus === MOCK_USER_STATUS.BUSY ? "Set to Online" : "Set to Busy"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        
        <div className="relative mb-4">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search channels, people..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex space-x-1 mb-4">
          {[
            { id: 'channels', label: 'Channels', icon: Hash },
            { id: 'people', label: 'People', icon: Users },
            { id: 'directory', label: 'Directory', icon: Building }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 ${
                  activeTab === tab.id 
                    ? 'bg-[#225F8B] text-white' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="h-4 w-4 mr-1" />
                {tab.label}
              </Button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        {activeTab === 'channels' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center">
                <Hash className="h-3 w-3 mr-1" /> Public Channels
              </h3>
              {getFilteredChannels().filter(ch => ch.type === 'public').map((channel) => (
                <Button
                  key={channel.id}
                  variant="ghost"
                  className={`w-full justify-start px-2 py-1 h-auto mb-1 ${
                    selectedChannel?.id === channel.id
                      ? 'bg-[#225F8B]/10 text-[#225F8B]' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  onClick={() => {setSelectedChannel(channel); setMessages([]); /* Clear messages when changing channel; fetch new ones if needed */}}
                >
                  <div className="flex items-center space-x-2 w-full">
                    <Hash className="h-4 w-4" />
                    <span className="font-medium">{channel.name}</span>
                    <span className="text-xs text-gray-500 ml-auto">{channel.memberCount}</span>
                  </div>
                </Button>
              ))}
            </div>

            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center">
                <Building className="h-3 w-3 mr-1" /> Department Channels
              </h3>
              {getFilteredChannels().filter(ch => ch.type === 'department').map((channel) => (
                <Button
                  key={channel.id}
                  variant="ghost"
                  className={`w-full justify-start px-2 py-1 h-auto mb-1 ${
                    selectedChannel?.id === channel.id
                      ? 'bg-[#225F8B]/10 text-[#225F8B]' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  onClick={() => {setSelectedChannel(channel); setMessages([]);}}
                >
                  <div className="flex items-center space-x-2 w-full">
                    <Hash className="h-4 w-4" />
                    <span className="font-medium">{channel.name}</span>
                    <span className="text-xs text-gray-500 ml-auto">{channel.memberCount}</span>
                  </div>
                </Button>
              ))}
            </div>

            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center">
                <Users className="h-3 w-3 mr-1" /> Team Channels
              </h3>
              {getFilteredChannels().filter(ch => ch.type === 'team').map((channel) => (
                <Button
                  key={channel.id}
                  variant="ghost"
                  className={`w-full justify-start px-2 py-1 h-auto mb-1 ${
                    selectedChannel?.id === channel.id
                      ? 'bg-[#225F8B]/10 text-[#225F8B]' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  onClick={() => {setSelectedChannel(channel); setMessages([]);}}
                >
                  <div className="flex items-center space-x-2 w-full">
                    <Hash className="h-4 w-4" />
                    <span className="font-medium text-sm">{channel.name}</span>
                    <span className="text-xs text-gray-500 ml-auto">{channel.memberCount}</span>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'people' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">All Employees</h3>
              <span className="text-xs text-gray-500">{getEmployeesForPeopleTab().length} members</span>
            </div>
            {getEmployeesForPeopleTab()
              .filter(emp => emp.Name.toLowerCase().includes(searchTerm.toLowerCase()))
              .map((emp) => ( // emp.id should be emp["Email ID"] from mock
                <div 
                  key={emp["Email ID"]}
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleEmployeeClick(emp)} // emp here is the full employee object from mock
                >
                  <div className="relative">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-[#225F8B] text-white text-xs">
                        {emp.Name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`absolute -bottom-0 -right-0 w-3 h-3 border-2 border-white rounded-full ${
                       (userStatuses[emp["Email ID"]] === MOCK_USER_STATUS.ONLINE) ? 'bg-green-500' :
                       (userStatuses[emp["Email ID"]] === MOCK_USER_STATUS.BUSY) ? 'bg-red-500' : 'bg-gray-400'
                    }`}></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{emp.Name}</div>
                    <div className="text-xs text-gray-500 truncate flex items-center">
                      <span>{emp.Designation} • {emp.Department}</span>
                      <span className={`ml-2 text-xs ${getStatusColor(userStatuses[emp["Email ID"]] || MOCK_USER_STATUS.OFFLINE)}`}>
                        {getStatusText(userStatuses[emp["Email ID"]] || MOCK_USER_STATUS.OFFLINE)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}

        {activeTab === 'directory' && (
          <div className="space-y-4"> {/* Directory still uses MOCK data, can be API driven */}
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Company Directory</h3>
            {Object.keys(DEPARTMENT_DATA).map((dept) => {
              const deptEmployees = Object.values(DEPARTMENT_DATA[dept]).flat();
              return (
                <div key={dept} className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Building className="h-4 w-4 text-[#225F8B]" />
                      <span className="font-semibold text-[#225F8B] text-sm">{dept}</span>
                    </div>
                    <Badge variant="outline" className="text-xs bg-white">
                      {deptEmployees.length} members
                    </Badge>
                  </div>
                  
                  {Object.keys(DEPARTMENT_DATA[dept]).map((subDept) => (
                    <div key={subDept} className="ml-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <ChevronRight className="h-3 w-3 text-gray-400" />
                        <span className="text-sm font-medium text-gray-700">{subDept}</span>
                        <Badge variant="secondary" className="text-xs">
                          {DEPARTMENT_DATA[dept][subDept].length}
                        </Badge>
                      </div>
                      <div className="ml-6 space-y-1">
                        {DEPARTMENT_DATA[dept][subDept]
                        .filter(e => e.Name.toLowerCase().includes(searchTerm.toLowerCase()))
                        .map((emp, index) => (
                          <div key={index} className="flex items-center space-x-2 py-1 hover:bg-gray-50 rounded px-2 cursor-pointer"
                               onClick={() => handleEmployeeClick(emp)}>
                            <Avatar className="w-6 h-6">
                              <AvatarFallback className="bg-gray-600 text-white text-xs">
                                {emp.Name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-medium text-gray-900 truncate">{emp.Name}</div>
                              <div className="text-xs text-gray-500 truncate">{emp.Designation}</div>
                            </div>
                             <div className={`w-2 h-2 rounded-full ${
                                userStatuses[emp["Email ID"]] === MOCK_USER_STATUS.ONLINE ? 'bg-green-500' :
                                userStatuses[emp["Email ID"]] === MOCK_USER_STATUS.BUSY ? 'bg-red-500' : 'bg-gray-400'
                              }`}></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  const renderChatArea = () => (
    <div className="flex-1 flex flex-col bg-white/70 backdrop-blur-sm">
      <div className="p-4 border-b border-gray-200 bg-white/90">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getChannelIcon(selectedChannel)}
            <div>
              <h3 className="font-semibold text-gray-900">{selectedChannel?.name || "Select a Channel"}</h3>
              <p className="text-sm text-gray-600">{selectedChannel?.description || ""}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-xs">
              {selectedChannel?.memberCount || 0} members
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost" disabled={!selectedChannel}>
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem 
                  onClick={handleDeleteMessages}
                  disabled={!selectedChannel}
                  className="text-red-600 hover:text-red-700 cursor-pointer"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete all messages (local)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-4">
          {getChannelMessages().map((message) => ( // message.id should be unique, from backend ideally
            <div key={message.id || message.timestamp} className="flex items-start space-x-3">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-[#225F8B] text-white text-xs">
                  {message.sender_name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-sm text-gray-900">{message.sender_name}</span>
                    <span className="text-xs text-gray-500 flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatTime(message.timestamp)}
                    </span>
                  </div>
                  {message.sender_id === user?.id && !message.deleted && (
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
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="p-4 border-t border-gray-200 bg-white/90">
        <div className="flex items-center space-x-2">
          <Input
            placeholder={selectedChannel ? `Message #${selectedChannel.name}` : "Select a channel to message"}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            className="flex-1"
            disabled={!user || !selectedChannel}
          />
          <Button 
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || !user || !selectedChannel}
            className="bg-[#225F8B] hover:bg-[#225F8B]/90"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  if (!user) {
    return (
      <div className="flex justify-center items-center h-full">
        <p>Please log in to use Internal Communication.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Internal Communication</h2>
        <Badge variant="outline" className="bg-[#225F8B]/10 text-[#225F8B] border-[#225F8B]/20">
          {viewMode === 'directChat' ? 'Direct Message' : 'Team Chat & Directory'}
        </Badge>
      </div>

      {viewMode === 'directChat' && selectedEmployee ? (
        <DirectChat 
          selectedEmployee={selectedEmployee} // Ensure selectedEmployee has an id like 'user@example.com'
          onBack={handleBackToChannels}
        />
      ) : (
        <Card className="h-[calc(100vh-200px)] min-h-[600px] overflow-hidden bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <div className="flex h-full">
            {renderSidebar()}
            {renderChatArea()}
          </div>
        </Card>
      )}

      {/* Communication Features - these are static descriptive cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-r from-[#225F8B]/5 to-[#225F8B]/10 border-[#225F8B]/20">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-[#225F8B]/10 rounded-full flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-[#225F8B]" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Department Channels</h4>
                <p className="text-sm text-gray-600">Team-specific discussions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-[#225F8B]/5 to-[#225F8B]/10 border-[#225F8B]/20">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-[#225F8B]/10 rounded-full flex items-center justify-center">
                <Users className="h-5 w-5 text-[#225F8B]" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Employee Directory</h4>
                <p className="text-sm text-gray-600">Find and connect with colleagues</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-[#225F8B]/5 to-[#225F8B]/10 border-[#225F8B]/20">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-[#225F8B]/10 rounded-full flex items-center justify-center">
                <UserPlus className="h-5 w-5 text-[#225F8B]" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Real-time Messaging</h4>
                <p className="text-sm text-gray-600">Instant team communication</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InternalCommunication;