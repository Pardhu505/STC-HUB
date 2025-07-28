import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from './ui/dialog';
import { Label } from './ui/label';
import { 
  Calendar, 
  Clock, 
  Users, 
  Plus, 
  Video, 
  Mail, 
  Trash2,
  ExternalLink,
  CalendarPlus,
  UserPlus
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { format, parseISO, addMinutes, startOfDay } from 'date-fns';

const MeetingScheduler = () => {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    attendees: []
  });
  const [attendeeEmail, setAttendeeEmail] = useState('');

  useEffect(() => {
    fetchMeetings();
  }, []);

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
      const response = await fetch(`${backendUrl}/api/meetings?user_id=${user.id}`);
      
      if (response.ok) {
        const data = await response.json();
        setMeetings(data);
      }
    } catch (error) {
      console.error('Error fetching meetings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMeeting = async () => {
    if (!formData.title || !formData.start_time || !formData.end_time) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
      
      const meetingData = {
        ...formData,
        start_time: new Date(formData.start_time).toISOString(),
        end_time: new Date(formData.end_time).toISOString()
      };

      const response = await fetch(`${backendUrl}/api/meetings?creator_id=${user.id}&creator_name=${encodeURIComponent(user.name)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(meetingData),
      });

      if (response.ok) {
        const newMeeting = await response.json();
        setMeetings(prev => [...prev, newMeeting]);
        setIsCreateDialogOpen(false);
        resetForm();
      } else {
        const error = await response.json();
        alert(`Failed to create meeting: ${error.detail}`);
      }
    } catch (error) {
      console.error('Error creating meeting:', error);
      alert('Failed to create meeting');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMeeting = async (meetingId) => {
    if (!confirm('Are you sure you want to delete this meeting?')) return;

    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
      const response = await fetch(`${backendUrl}/api/meetings/${meetingId}?user_id=${user.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setMeetings(prev => prev.filter(m => m.id !== meetingId));
      } else {
        const error = await response.json();
        alert(`Failed to delete meeting: ${error.detail}`);
      }
    } catch (error) {
      console.error('Error deleting meeting:', error);
      alert('Failed to delete meeting');
    }
  };

  const addAttendee = () => {
    if (attendeeEmail && !formData.attendees.includes(attendeeEmail)) {
      setFormData(prev => ({
        ...prev,
        attendees: [...prev.attendees, attendeeEmail]
      }));
      setAttendeeEmail('');
    }
  };

  const removeAttendee = (email) => {
    setFormData(prev => ({
      ...prev,
      attendees: prev.attendees.filter(e => e !== email)
    }));
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      start_time: '',
      end_time: '',
      attendees: []
    });
    setAttendeeEmail('');
  };

  const formatDateTime = (dateTimeString) => {
    try {
      return format(parseISO(dateTimeString), 'MMM dd, yyyy • h:mm a');
    } catch {
      return dateTimeString;
    }
  };

  const isUpcoming = (startTime) => {
    return new Date(startTime) > new Date();
  };

  const isPast = (endTime) => {
    return new Date(endTime) < new Date();
  };

  const isOngoing = (startTime, endTime) => {
    const now = new Date();
    return new Date(startTime) <= now && now <= new Date(endTime);
  };

  const getMeetingStatus = (meeting) => {
    if (isOngoing(meeting.start_time, meeting.end_time)) {
      return { label: 'Ongoing', color: 'bg-green-500' };
    } else if (isUpcoming(meeting.start_time)) {
      return { label: 'Upcoming', color: 'bg-blue-500' };
    } else {
      return { label: 'Past', color: 'bg-gray-500' };
    }
  };

  // Set default times (next hour and +1 hour from that)
  const getDefaultTimes = () => {
    const now = new Date();
    const nextHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() + 1, 0, 0);
    const oneHourLater = addMinutes(nextHour, 60);
    
    return {
      start: nextHour.toISOString().slice(0, 16),
      end: oneHourLater.toISOString().slice(0, 16)
    };
  };

  const defaultTimes = getDefaultTimes();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Meetings & Calendar</h2>
          <p className="text-gray-600">Schedule and manage your meetings</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#225F8B] hover:bg-[#225F8B]/90">
              <CalendarPlus className="h-4 w-4 mr-2" />
              Schedule Meeting
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Schedule New Meeting</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Meeting Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter meeting title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Meeting description (optional)"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_time">Start Time *</Label>
                  <Input
                    id="start_time"
                    type="datetime-local"
                    value={formData.start_time || defaultTimes.start}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="end_time">End Time *</Label>
                  <Input
                    id="end_time"
                    type="datetime-local"
                    value={formData.end_time || defaultTimes.end}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                  />
                </div>
              </div>
              
              <div>
                <Label>Attendees</Label>
                <div className="flex space-x-2 mb-2">
                  <Input
                    placeholder="Enter email address"
                    value={attendeeEmail}
                    onChange={(e) => setAttendeeEmail(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addAttendee()}
                  />
                  <Button type="button" onClick={addAttendee} size="sm">
                    <UserPlus className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {formData.attendees.map((email, index) => (
                    <Badge key={index} variant="secondary" className="pr-1">
                      {email}
                      <button
                        onClick={() => removeAttendee(email)}
                        className="ml-2 hover:text-red-500"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateMeeting} disabled={loading}>
                {loading ? 'Creating...' : 'Create Meeting'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Meetings List */}
      <div className="space-y-4">
        {loading && meetings.length === 0 ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#225F8B] mx-auto"></div>
            <p className="text-gray-500 mt-4">Loading meetings...</p>
          </div>
        ) : meetings.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No meetings scheduled</h3>
              <p className="text-gray-500 mb-4">Create your first meeting to get started</p>
              <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-[#225F8B] hover:bg-[#225F8B]/90">
                <CalendarPlus className="h-4 w-4 mr-2" />
                Schedule Meeting
              </Button>
            </CardContent>
          </Card>
        ) : (
          meetings.map((meeting) => {
            const status = getMeetingStatus(meeting);
            return (
              <Card key={meeting.id} className="border-l-4 border-l-[#225F8B]">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{meeting.title}</h3>
                        <Badge className={`${status.color} text-white`}>
                          {status.label}
                        </Badge>
                      </div>
                      
                      {meeting.description && (
                        <p className="text-gray-600 mb-3">{meeting.description}</p>
                      )}
                      
                      <div className="flex items-center space-x-6 text-sm text-gray-500 mb-3">
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4" />
                          <span>{formatDateTime(meeting.start_time)} - {format(parseISO(meeting.end_time), 'h:mm a')}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4" />
                          <span>{meeting.attendees.length} attendees</span>
                        </div>
                      </div>
                      
                      {meeting.attendees.length > 0 && (
                        <div className="flex items-center space-x-2 mb-4">
                          <span className="text-sm text-gray-500">Attendees:</span>
                          <div className="flex flex-wrap gap-1">
                            {meeting.attendees.slice(0, 3).map((email, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {email}
                              </Badge>
                            ))}
                            {meeting.attendees.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{meeting.attendees.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {meeting.meeting_link && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(meeting.meeting_link, '_blank')}
                          className="text-[#225F8B] border-[#225F8B] hover:bg-[#225F8B] hover:text-white"
                        >
                          <Video className="h-4 w-4 mr-2" />
                          Join Meeting
                        </Button>
                      )}
                      
                      {meeting.creator_id === user.id && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteMeeting(meeting.id)}
                          className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center space-x-2">
                      <Avatar className="w-6 h-6">
                        <AvatarFallback className="bg-[#225F8B] text-white text-xs">
                          {meeting.creator_name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-gray-500">Created by {meeting.creator_name}</span>
                    </div>
                    
                    <div className="text-xs text-gray-400">
                      {format(parseISO(meeting.created_at || meeting.start_time), 'MMM dd, yyyy')}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default MeetingScheduler;