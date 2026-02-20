// Mock data for the Ahaw Church Management System

export type HierarchyLevel = 
  | 'Sinodos' 
  | 'KuamiSinodos' 
  | 'Memriya' 
  | 'Zone' 
  | 'Atbiya' 
  | 'EnkesekaseMaikel' 
  | 'HiyawanMahderat';

export type MinistryType = 
  | 'Sunday School'
  | 'Youth Ministry'
  | 'Women Ministry'
  | 'Choir'
  | 'Deacon Service'
  | 'Prayer Team'
  | 'Media Ministry';

export interface User {
  id: string;
  fullName: string;
  phoneNumber: string;
  address: {
    region: string;
    zone: string;
    woreda: string;
  };
  dateOfBirth: string;
  gender: 'Male' | 'Female';
  ministryType: MinistryType[];
  hierarchyLevel: HierarchyLevel;
  email: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  createdBy: string;
  createdByLevel: HierarchyLevel;
  createdAt: string;
  priority: 'low' | 'medium' | 'high';
}

export interface Plan {
  id: string;
  name: string;
  timeFrequency: 'weekly' | 'monthly' | 'yearly';
  details: string;
  createdAt: string;
  createdBy: string;
}

export interface Report {
  id: string;
  time: string;
  option: 'Memriya' | 'Kifil' | 'Zerf';
  timeFrequency: 'weekly' | 'monthly' | 'yearly';
  planId: string;
  planName: string;
  workDone: string;
  result: string;
  comments: Comment[];
  reportBack?: ReportBack;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: string;
  replies?: Comment[];
}

export interface ReportBack {
  id: string;
  reportId: string;
  planId: string;
  planName: string;
  feedback: string;
  createdAt: string;
  createdBy: string;
}

export interface Meeting {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  attendees: string[];
}

// Mock Users
export const mockUsers: User[] = [
  {
    id: '1',
    fullName: 'Abune Mathias',
    phoneNumber: '+251911234567',
    address: { region: 'Addis Ababa', zone: 'Bole', woreda: 'Bole Sub City' },
    dateOfBirth: '1948-12-05',
    gender: 'Male',
    ministryType: ['Prayer Team'],
    hierarchyLevel: 'Sinodos',
    email: 'sinodos@ahaw.org'
  },
  {
    id: '2',
    fullName: 'Ato Tekle Selassie',
    phoneNumber: '+251922345678',
    address: { region: 'Addis Ababa', zone: 'Kirkos', woreda: 'Kirkos Sub City' },
    dateOfBirth: '1965-03-15',
    gender: 'Male',
    ministryType: ['Sunday School', 'Youth Ministry'],
    hierarchyLevel: 'KuamiSinodos',
    email: 'kuami@ahaw.org'
  },
  {
    id: '3',
    fullName: 'W/ro Sara Hailu',
    phoneNumber: '+251933456789',
    address: { region: 'Addis Ababa', zone: 'Arada', woreda: 'Arada Sub City' },
    dateOfBirth: '1975-08-20',
    gender: 'Female',
    ministryType: ['Women Ministry', 'Choir'],
    hierarchyLevel: 'Memriya',
    email: 'memriya1@ahaw.org'
  },
  {
    id: '4',
    fullName: 'Ato Daniel Bekele',
    phoneNumber: '+251944567890',
    address: { region: 'Oromia', zone: 'East Shewa', woreda: 'Adama' },
    dateOfBirth: '1980-11-10',
    gender: 'Male',
    ministryType: ['Deacon Service'],
    hierarchyLevel: 'Zone',
    email: 'zone1@ahaw.org'
  },
  {
    id: '5',
    fullName: 'W/ro Hanna Tadesse',
    phoneNumber: '+251955678901',
    address: { region: 'Addis Ababa', zone: 'Yeka', woreda: 'Yeka Sub City' },
    dateOfBirth: '1990-05-25',
    gender: 'Female',
    ministryType: ['Youth Ministry', 'Media Ministry'],
    hierarchyLevel: 'HiyawanMahderat',
    email: 'hiyawan1@ahaw.org'
  }
];

// Mock Announcements
export const mockAnnouncements: Announcement[] = [
  {
    id: '1',
    title: 'የፋሲካ በዓል አከባበር (Fasika Celebration)',
    content: 'All churches are invited to prepare for the Easter celebration. Special services will be held starting April 20th. Please coordinate with your local Memriya for detailed schedules.',
    createdBy: 'Abune Mathias',
    createdByLevel: 'Sinodos',
    createdAt: '2024-03-15T10:00:00Z',
    priority: 'high'
  },
  {
    id: '2',
    title: 'Youth Ministry Training Program',
    content: 'A comprehensive training program for youth ministry leaders will commence next month. Registration is now open for all Atbiya representatives.',
    createdBy: 'Ato Tekle Selassie',
    createdByLevel: 'KuamiSinodos',
    createdAt: '2024-03-10T14:30:00Z',
    priority: 'medium'
  },
  {
    id: '3',
    title: 'Monthly Report Submission Reminder',
    content: 'Please submit your monthly activity reports by the 5th of each month. Late submissions affect our planning and resource allocation.',
    createdBy: 'W/ro Sara Hailu',
    createdByLevel: 'Memriya',
    createdAt: '2024-03-01T09:00:00Z',
    priority: 'medium'
  }
];

// Mock Plans
export const mockPlans: Plan[] = [
  {
    id: 'p1',
    name: 'Sunday School Curriculum Development',
    timeFrequency: 'yearly',
    details: 'Develop a comprehensive curriculum for all age groups including children, youth, and adults with focus on biblical teachings and Ethiopian Orthodox traditions.',
    createdAt: '2024-01-01T08:00:00Z',
    createdBy: 'Memriya Council'
  },
  {
    id: 'p2',
    name: 'Weekly Prayer Meetings',
    timeFrequency: 'weekly',
    details: 'Conduct prayer meetings every Wednesday evening at 6 PM. Focus on community needs and spiritual growth.',
    createdAt: '2024-01-15T10:00:00Z',
    createdBy: 'Zone Leadership'
  },
  {
    id: 'p3',
    name: 'Quarterly Outreach Programs',
    timeFrequency: 'monthly',
    details: 'Organize community outreach including food distribution, health awareness, and spiritual counseling.',
    createdAt: '2024-02-01T12:00:00Z',
    createdBy: 'Atbiya Council'
  }
];

// Mock Reports
export const mockReports: Report[] = [
  {
    id: 'r1',
    time: '2024-03-01T00:00:00Z',
    option: 'Memriya',
    timeFrequency: 'monthly',
    planId: 'p1',
    planName: 'Sunday School Curriculum Development',
    workDone: 'Completed first draft of children curriculum (ages 5-12). Reviewed by 3 Memriya members. Conducted pilot program with 25 students.',
    result: 'Positive feedback from parents and teachers. 85% engagement rate. Some adjustments needed for age 5-7 group.',
    comments: [
      {
        id: 'c1',
        userId: '2',
        userName: 'Ato Tekle Selassie',
        content: 'Excellent work! The material is well-structured. Consider adding more interactive elements for younger children.',
        createdAt: '2024-03-05T10:00:00Z',
        replies: [
          {
            id: 'c1-r1',
            userId: '3',
            userName: 'W/ro Sara Hailu',
            content: 'Agreed. I will work on adding visual aids and storytelling components.',
            createdAt: '2024-03-05T14:00:00Z'
          }
        ]
      }
    ]
  },
  {
    id: 'r2',
    time: '2024-03-08T00:00:00Z',
    option: 'Kifil',
    timeFrequency: 'weekly',
    planId: 'p2',
    planName: 'Weekly Prayer Meetings',
    workDone: 'Held 4 prayer meetings this month with average attendance of 45 people. Topics covered: family unity, youth guidance, and community peace.',
    result: 'Strong participation. Many testimonies of answered prayers. Request for additional morning sessions.',
    comments: []
  }
];

// Mock Meetings
export const mockMeetings: Meeting[] = [
  {
    id: 'm1',
    title: 'Sinodos Council Quarterly Meeting',
    description: 'Review of church activities, financial reports, and planning for upcoming religious festivals.',
    date: '2024-04-15T09:00:00Z',
    location: 'Holy Trinity Cathedral, Addis Ababa',
    attendees: ['Abune Mathias', 'All KuamiSinodos Representatives']
  },
  {
    id: 'm2',
    title: 'Youth Ministry Strategy Session',
    description: 'Planning youth engagement programs and addressing challenges in modern ministry.',
    date: '2024-03-25T14:00:00Z',
    location: 'St. Mary Church Conference Hall',
    attendees: ['Youth Ministry Leaders', 'Memriya Representatives']
  }
];

// Current user for demo (can be changed to test different hierarchy levels)
export const currentUser: User = mockUsers[2]; // Memriya level user
