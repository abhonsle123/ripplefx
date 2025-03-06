
export type SubscriptionPlan = "free" | "premium" | "pro";

export interface PlanFeature {
  name: string;
  description: string;
  requiredPlan: SubscriptionPlan;
}

export interface SubscriptionFeatures {
  maxWatchlistItems: number;
  realTimeAlerts: boolean;
  aiAnalysis: boolean;
  smsAlerts: boolean;
  customAlertRules: boolean;
  prioritySupport: boolean;
  apiAccess: boolean;
}

export const PLAN_FEATURES: Record<SubscriptionPlan, SubscriptionFeatures> = {
  free: {
    maxWatchlistItems: 3,
    realTimeAlerts: false,
    aiAnalysis: false,
    smsAlerts: false,
    customAlertRules: false,
    prioritySupport: false,
    apiAccess: false
  },
  premium: {
    maxWatchlistItems: 15,
    realTimeAlerts: true,
    aiAnalysis: true,
    smsAlerts: true,
    customAlertRules: false,
    prioritySupport: true,
    apiAccess: false
  },
  pro: {
    maxWatchlistItems: 999, // effectively unlimited
    realTimeAlerts: true,
    aiAnalysis: true,
    smsAlerts: true,
    customAlertRules: true,
    prioritySupport: true,
    apiAccess: true
  }
};

// Flag to indicate which plans are currently available
export const AVAILABLE_PLANS: Record<SubscriptionPlan, boolean> = {
  free: true,
  premium: true,
  pro: true // Pro plan is now available
};
