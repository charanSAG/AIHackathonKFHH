export type TabType = 'home' | 'crops' | 'doctor' | 'mandi' | 'wallet';

export type LanguageCode = 'te' | 'hi' | 'en' | 'ta' | 'mr' | 'kn';

export interface LanguageOption {
  code: LanguageCode;
  label: string;
  nativeLabel: string;
  dialectTag: string;
}

export interface CropDisease {
  id: string;
  cropName: string;
  cropFamily: string;
  diseaseName: string;
  scientificName: string;
  severity: 'Mild' | 'Moderate' | 'Severe' | 'Critical';
  severityLevel: string; // e.g. "Level 2/4"
  confidence: number;
  imageUrl: string;
  altText: string;
  targetSpot: string;
  scanTime: string;
  symptoms: string[];
  yieldRiskForecast: string;
  treatment: {
    organic: {
      name: string;
      description: string;
      cost: string;
      steps: {
        dosage: string;
        applicationTime: string;
        repeatInterval: string;
      };
    };
    chemical: {
      name: string;
      description: string;
      actionTag: string;
      dosage: string;
      dosagePerAcre: string;
      phiDays: number;
      safetyWarning: string;
    };
  };
  preventiveMeasures: {
    title: string;
    description: string;
    icon: string;
  }[];
  audioGuide: {
    title: string;
    durationSeconds: number;
    narrationText: Record<LanguageCode, string>;
  };
}

export interface StoreItem {
  id: string;
  name: string;
  address: string;
  distance: string;
  phone: string;
  inStock: boolean;
  medicines: {
    name: string;
    packSize: string;
    price: number;
  }[];
}

export interface AgronomistProfile {
  name: string;
  role: string;
  institute: string;
  status: string;
  avatarUrl: string;
  rating: number;
  replyTime: string;
}

export interface VoiceQuery {
  spokenText: string;
  language: string;
  confidence: number;
  dialect: string;
  englishTranslation: string;
  aiResponse?: {
    summary: string;
    keyPoints: string[];
    sprayAdvice: string;
    teluguResponse: string;
    hindiResponse: string;
  };
}
