/**
 * Service for dynamically loading and launching Razorpay Checkout Modal.
 * Standard script: https://checkout.razorpay.com/v1/checkout.js
 */

export interface RazorpayCheckoutOptions {
  key: string;
  amount: number; // in paise
  currency: string;
  name: string;
  description: string;
  image?: string;
  order_id: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color?: string;
  };
}

export interface RazorpaySuccessResult {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

declare global {
  interface Window {
    Razorpay?: any;
  }
}

export class RazorpayLoader {
  private static scriptPromise: Promise<boolean> | null = null;

  public static loadScript(): Promise<boolean> {
    if (typeof window === 'undefined') return Promise.resolve(false);

    if (window.Razorpay) {
      return Promise.resolve(true);
    }

    if (this.scriptPromise) {
      return this.scriptPromise;
    }

    this.scriptPromise = new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => {
        resolve(true);
      };
      script.onerror = () => {
        console.error('Failed to load Razorpay checkout script from checkout.razorpay.com');
        this.scriptPromise = null;
        resolve(false);
      };
      document.body.appendChild(script);
    });

    return this.scriptPromise;
  }
}

export const razorpayService = {
  /**
   * Opens the Razorpay Checkout Modal and returns a Promise that resolves on successful payment
   * or rejects on modal dismissal / gateway failure.
   */
  async openCheckout(options: RazorpayCheckoutOptions): Promise<RazorpaySuccessResult> {
    const isLoaded = await RazorpayLoader.loadScript();
    if (!isLoaded || !window.Razorpay) {
      throw new Error('Razorpay Checkout SDK could not be loaded. Please check your internet connection.');
    }

    return new Promise((resolve, reject) => {
      let isHandled = false;

      const rzpOptions = {
        ...options,
        handler: (response: RazorpaySuccessResult) => {
          isHandled = true;
          resolve(response);
        },
        modal: {
          ondismiss: () => {
            if (!isHandled) {
              const err = new Error('Payment was cancelled or closed by user.');
              (err as any).code = 'PAYMENT_DISMISSED';
              reject(err);
            }
          },
          escape: true,
          backdropclose: false,
        },
      };

      try {
        const rzp = new window.Razorpay(rzpOptions);
        rzp.on('payment.failed', (resp: any) => {
          isHandled = true;
          const err = new Error(resp.error?.description || 'Payment failed at gateway.');
          (err as any).code = resp.error?.code || 'PAYMENT_FAILED';
          (err as any).details = resp.error;
          reject(err);
        });
        rzp.open();
      } catch (err) {
        reject(err);
      }
    });
  },
};
