export type Business = "TRILLION_TRADING" | "RIGHT_ALGO_TRADING";
export type Product = "LEVEL_1" | "LEVEL_2" | "COURSE_PACKAGE" | "SOFTWARE" | "REGISTRATION" | "RIGHT_SOFTWARE"  | "SHORT_TERM_BREAKOUT";
export interface Customer {
  name: string;
  email: string;
  mobile: string;
}
export interface Report {
  id: string;
  title: string;
  description: string;
  date: string;
  category: string;
  imageUrl: string;
  downloadUrl?: string;
}


export interface VerifiedOrder {
  verified: boolean;
  business: Business;
  product: string;
  amount: number;
  paymentId: string;
  orderId: string;
  paymentStatus?: string;
  receiptUrl?: string;
  onboarding?: string;
  membershipEligible?: boolean;
  customer?: Customer;
}

export interface Member {
  name: string;
  email: string;
  mobile: string;
}
export interface Membership {
  active: boolean;
  paymentVerified: boolean;
  registrationVerified: boolean;
  status: string;
  paymentStatus: string;
}
export interface VerifiedOrder {
  verified: boolean;
  business: Business;
  product: string;
  amount: number;
  paymentId: string;
  orderId: string;
  receiptUrl?: string;
  onboarding?: string;
  membershipEligible?: boolean;
  customer?: Customer;
}
export interface PaymentOrder {
  keyId: string;
  orderId: string;
  amount: number;
  currency: string;
  business: Business;
}
