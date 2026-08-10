export const dashboardEn = {
  welcome: 'Welcome',
  overview: 'Overview',
  recentActivity: 'Recent Activity',
  statistics: 'Statistics',
  totalMembers: 'Total Members',
  activeAnnouncements: 'Active Announcements',
  pendingReports: 'Pending Reports',
  upcomingMeetings: 'Upcoming Meetings',
  recentAnnouncements: 'Recent Announcements',
  recentReports: 'Recent Reports',
  noAnnouncementsAvailable: 'No announcements available',
  noReportsSubmitted: 'No reports submitted yet',
  noUpcomingMeetings: 'No upcoming meetings scheduled',
  submitReport: 'Submit Report',
  viewMembers: 'View Members',
};

/**
 * Amharic is the default language, so a missing key here is a bug, not a
 * fallback. `Record` rather than `Partial<Record>` makes that a compile error.
 */
export const dashboardAm: Record<keyof typeof dashboardEn, string> = {
  welcome: 'እንኳን ደህና መጡ',
  overview: 'አጠቃላይ እይታ',
  recentActivity: 'የቅርብ ጊዜ እንቅስቃሴ',
  statistics: 'ስታቲስቲክስ',
  totalMembers: 'ጠቅላላ አባላት',
  activeAnnouncements: 'ንቁ ማስታወቂያዎች',
  pendingReports: 'በመጠባበቅ ላይ ያሉ ሪፖርቶች',
  upcomingMeetings: 'መጪ ስብሰባዎች',
  recentAnnouncements: 'የቅርብ ጊዜ ማስታወቂያዎች',
  recentReports: 'የቅርብ ጊዜ ሪፖርቶች',
  noAnnouncementsAvailable: 'ምንም ማስታወቂያዎች የሉም',
  noReportsSubmitted: 'ገና ምንም ሪፖርቶች አልቀረቡም',
  noUpcomingMeetings: 'ምንም መጪ ስብሰባዎች አልተያዙም',
  submitReport: 'ሪፖርት አስገባ',
  viewMembers: 'አባላትን ይመልከቱ',
};

export const dashboardOm: Partial<Record<keyof typeof dashboardEn, string>> = {
  welcome: 'Baga Nagaan Dhuftan',
  overview: 'Waliigala',
  recentActivity: 'Socho\'a Dhiyoo',
  statistics: 'Istaatistiksii',
  totalMembers: 'Miseensota Waliigalaa',
  activeAnnouncements: 'Beeksisa Hojirra Jiru',
  pendingReports: 'Gabaasa Eeggamaa Jiru',
  upcomingMeetings: 'Walga\'ii Fuulduraa',
  recentAnnouncements: 'Beeksisa Dhiyoo',
  recentReports: 'Gabaasa Dhiyoo',
  noAnnouncementsAvailable: 'Beeksiisni hin jiru',
  noReportsSubmitted: 'Gabaasni hin jiru',
  noUpcomingMeetings: 'Walga\'iin hin jiru',
  submitReport: 'Gabaasa Galchi',
  viewMembers: 'Miseensota Ilaali',
};

export const dashboardTi: Partial<Record<keyof typeof dashboardEn, string>> = {
  welcome: 'እንቋዕ ብደሓን መጻእኩም',
  overview: 'ሓፈሻዊ ትርኢት',
  recentActivity: 'ናይ ቀረባ እዋን ንጥፈታት',
  statistics: 'ስታቲስቲክስ',
  totalMembers: 'ጠቕላላ ኣባላት',
  activeAnnouncements: 'ንጡፋት ምልክታታት',
  pendingReports: 'ዝጽበዩ ጸብጻባት',
  upcomingMeetings: 'ዝመጹ ኣኼባታት',
  recentAnnouncements: 'ናይ ቀረባ ምልክታታት',
  recentReports: 'ናይ ቀረባ ጸብጻባት',
  noAnnouncementsAvailable: 'ምልክታታት የለን',
  noReportsSubmitted: 'ክሳብ ሕጂ ጸብጻብ ኣይቀረበን',
  noUpcomingMeetings: 'ዝመጽእ ኣኼባ የለን',
  submitReport: 'ጸብጻብ ኣቕርብ',
  viewMembers: 'ኣባላት ርአ',
};
