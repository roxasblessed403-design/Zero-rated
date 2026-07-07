export interface ZeroRatedSite {
  id: string;
  name: string;
  domain: string;
  category: 'math' | 'science' | 'general' | 'resource';
  description: string;
  logo: string;
  isPopular?: boolean;
}

export interface SavedNote {
  id: string;
  title: string;
  content: string;
  urlContext?: string;
  createdAt: string;
  driveFileId?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'tutor';
  text: string;
  timestamp: string;
}
