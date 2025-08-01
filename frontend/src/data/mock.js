// Mock portal data
export const PORTAL_DATA = [
  {
    id: 1,
    title: "Work Reporting Portal",
    description: "Daily work reporting and task management system",
    url: "https://workreportingshowtimeconsultingin.vercel.app/",
    icon: "📊",
    gradient: "from-blue-500 to-purple-600",
    category: "Reporting"
  },
  {
    id: 2,
    title: "Workplace Portal",
    description: "Main workplace management and communication hub",
    url: "https://showtimeconsulting.co.in",
    icon: "🏢",
    gradient: "from-green-500 to-blue-600",
    category: "Management"
  },
  {
    id: 3,
    title: "Survey Management Portal",
    description: "Manage surveys and analytics dashboard for insights",
    url: "https://stc-survey-manageme-portal.vercel.app",
    icon: "📋",
    gradient: "from-purple-500 to-pink-600",
    category: "Analytics"
  },
  {
    id: 4,
    title: "YouTube Trends & Sentiment Analysis",
    description: "Platform for YouTube analytics and sentiment analysis.",
    url: "https://youtube-trendsshowtimeconsultingin.vercel.app",
    icon: "▶️",
    gradient: "from-red-500 to-red-700",
    category: "Analytics • Social Media"
  },
  {
    id: 5,
    title: "News Dashboard & Sentiment Analysis",
    description: "Real-time news dashboard and sentiment analysis platform.",
    url: "https://newsanalysisshowtimeconsultingin.vercel.app",
    icon: "📰",
    gradient: "from-teal-500 to-cyan-600",
    category: "News • Analytics"
  },
  {
    id: 6,
    title: "Twitter Analytics Tool",
    description: "Advanced Twitter analysis tool with visual reports",

    url: "https://stc-twitter-analytics-portal.vercel.app",
    icon: (
      "<svg" +
      '        xmlns="http://www.w3.org/2000/svg"' +
      '        viewBox="0 0 24 24"' +
      '        fill="currentColor"' +
      '        className="w-8 h-8 text-white"' +
      "      >" +
      '        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>' +
      "</svg>"
    ),
    gradient: "from-gray-700 to-gray-900",
    category: "Analytics • Social Media"
  }
];


export const ANNOUNCEMENTS_DATA = [
  {
    id: 1,
    title: "New Work Reporting System Launch",
    content: "We're excited to announce the launch of our new work reporting system. Please access it through the portal cards below.",
    date: "2025-01-15",
    priority: "high",
    author: "HR Team"
  },
  {
    id: 2,
    title: "Q1 Performance Review Schedule",
    content: "Q1 performance reviews will be conducted from March 1-15, 2025. Please ensure all work reports are up to date.",
    date: "2025-01-14",
    priority: "medium",
    author: "Management"
  },
  {
    id: 3,
    title: "System Maintenance Notice",
    content: "Scheduled maintenance will be performed on January 20, 2025, from 2:00 AM to 4:00 AM IST. Some services may be temporarily unavailable.",
    date: "2025-01-13",
    priority: "low",
    author: "IT Team"
  }
];

// Birthday checking and announcement generation
// This part is left for now, but should ideally be moved to backend logic
export const checkBirthdays = (employees) => {
  if (!employees) return [];
  const today = new Date();
  const todayMonth = today.getMonth() + 1;
  const todayDate = today.getDate();
  
  return employees.filter(emp => {
    if (emp.date_of_birth) {
      const birthDate = new Date(emp.date_of_birth);
      return birthDate.getMonth() + 1 === todayMonth && birthDate.getDate() === todayDate;
    }
    return false;
  });
};

export const generateBirthdayAnnouncements = (birthdayEmployees) => {
  return birthdayEmployees.map(emp => ({
    id: `birthday-${emp.email}-${new Date().getTime()}`,
    title: `🎉 Happy Birthday ${emp.name}! 🎂`,
    content: `Today we celebrate ${emp.name} from ${emp.department} department. Wishing you a wonderful year ahead filled with success and happiness!`,
    date: new Date().toISOString().split('T')[0],
    priority: "medium",
    author: "HR Team",
    type: "birthday"
  }));
};

// User status constants - these are still useful for the frontend
export const USER_STATUS = {
  ONLINE: 'online',
  OFFLINE: 'offline',
  BUSY: 'busy'
};

// This function can still be useful for displaying status text in components
export const getStatusText = (status) => {
  switch (status) {
    case USER_STATUS.ONLINE:
      return 'Online';
    case USER_STATUS.BUSY:
      return 'Busy';
    case USER_STATUS.OFFLINE:
      return 'Offline';
    default:
      return 'Unknown'; // Or return status itself, or an empty string
  }
};
