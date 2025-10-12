declare module 'paystack' {
  interface PaystackCustomer {
    customer_code: string;
    email: string;
    first_name: string;
    last_name: string;
  }

  interface PaystackTransaction {
    reference: string;
    authorization_url: string;
    access_code: string;
  }

  interface PaystackVerification {
    data: {
      status: string;
      reference: string;
      amount: number;
      currency: string;
      customer: PaystackCustomer;
      metadata: any;
    };
  }

  interface PaystackClient {
    customer: {
      create: (data: any) => Promise<{ data: PaystackCustomer }>;
    };
    transaction: {
      initialize: (data: any) => Promise<{ data: PaystackTransaction }>;
      verify: (reference: string) => Promise<PaystackVerification>;
    };
  }

  function paystack(secretKey: string): PaystackClient;
  export = paystack;
}