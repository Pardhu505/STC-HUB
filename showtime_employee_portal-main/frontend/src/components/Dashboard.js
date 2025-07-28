import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Header from './Header';
import PortalCards from './PortalCards';
import Announcements from './Announcements';
import UserProfile from './UserProfile';
import InternalCommunication from './InternalCommunication';
import AdminPanel from './AdminPanel';
import PayslipManagement from './PayslipManagement';
import NotificationSystem from './NotificationSystem';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Calendar, Users, BarChart3, Bell, MessageSquare, Gift, Shield, FileText } from 'lucide-react';
import { checkBirthdays, generateBirthdayAnnouncements } from '../data/mock';

const Dashboard = () => {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState('portals');
  const [birthdayAnnouncements, setBirthdayAnnouncements] = useState([]);
  const [newMessages, setNewMessages] = useState([]);
  const [newAnnouncements, setNewAnnouncements] = useState([]);

  // Listen for internal navigation events
  useEffect(() => {
    const handleNavigation = (event) => {
      if (event.detail === 'communication') {
        setActiveSection('communication');
      }
    };

    window.addEventListener('navigateToSection', handleNavigation);
    return () => window.removeEventListener('navigateToSection', handleNavigation);
  }, []);

  // Check for birthdays on component mount
  useEffect(() => {
    const birthdayEmployees = checkBirthdays();
    if (birthdayEmployees.length > 0) {
      const announcements = generateBirthdayAnnouncements(birthdayEmployees);
      setBirthdayAnnouncements(announcements);
    }
  }, []);

  const renderContent = () => {
    switch (activeSection) {
      case 'portals':
        return <PortalCards />;
      case 'announcements':
        return <Announcements initialAnnouncements={birthdayAnnouncements} />;
      case 'profile':
        return <UserProfile />;
      case 'communication':
        return <InternalCommunication />;
      case 'admin':
        return <AdminPanel />;
      case 'payslips':
        return <PayslipManagement />;
      default:
        return <PortalCards />;
    }
  };

  const navigationItems = [
    { id: 'portals', label: 'Portal Access', icon: BarChart3 },
    { id: 'announcements', label: 'Announcements', icon: Bell },
    { id: 'communication', label: 'Communication', icon: MessageSquare },
    { id: 'payslips', label: 'Payslips', icon: FileText },
    ...(user?.isAdmin ? [{ id: 'admin', label: 'Admin Panel', icon: Shield }] : []),
    { id: 'profile', label: 'Profile', icon: Users }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Background Shape */}
      <div className="absolute inset-0 opacity-10">
        <img 
          src="https://showtimeconsulting.in/web/images/thm-shape1.png" 
          alt="Background Shape" 
          className="w-full h-full object-cover object-center"
        />
      </div>

      {/* Animated Shape */}
      <div className="shape2 rotate-me">
        <img 
          src="https://showtimeconsulting.in/web/images/thm-shape1.png" 
          alt="About us" 
          className="w-20 h-20 opacity-20"
        />
      </div>
      
      <div className="relative z-10">
        <Header />
        
        <div className="container mx-auto px-4 py-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <Card className="bg-gradient-to-r from-[#225F8B] to-[#225F8B]/80 text-white border-0 shadow-xl">
              <CardContent className="p-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold mb-2">
                      Welcome back, {user?.name}!
                    </h1>
                    <p className="text-blue-100 text-lg">
                      {user?.designation} • {user?.department}
                    </p>
                    <p className="text-blue-200 text-sm mt-2">
                      Access your workspace portals and stay updated with company announcements
                    </p>
                    {birthdayAnnouncements.length > 0 && (
                      <div className="mt-4 flex items-center space-x-2">
                        <Gift className="h-5 w-5 text-yellow-300" />
                        <span className="text-yellow-200 text-sm">
                          {birthdayAnnouncements.length} birthday{birthdayAnnouncements.length > 1 ? 's' : ''} today! 🎉
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="hidden md:block">
                    <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
                      <Calendar className="h-16 w-16 text-white/80" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Navigation */}
          <div className="mb-8">
            <div className="flex flex-wrap gap-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.id}
                    variant={activeSection === item.id ? "default" : "outline"}
                    onClick={() => setActiveSection(item.id)}
                    className={`flex items-center gap-2 transition-all duration-200 ${
                      activeSection === item.id
                        ? 'bg-gradient-to-r from-[#225F8B] to-[#225F8B]/80 text-white shadow-lg'
                        : 'hover:bg-blue-50 hover:border-[#225F8B]/50 bg-white/80 backdrop-blur-sm'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Content Area */}
          <div className="transition-all duration-300">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;