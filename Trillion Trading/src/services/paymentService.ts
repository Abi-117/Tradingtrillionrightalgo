
import { api, post, ApiError } from "./apiClient";
import type {
  Business,
  Product,
  Customer,
  PaymentOrder,
  VerifiedOrder,
} from "@/types/business";



interface PaymentResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayInstance {
  open(): void;
  on(event: string, cb: (data: unknown) => void): void;
}

interface CouponValidationResponse {
  success: boolean;
  valid?: boolean;
  message?: string;
  coupon?: {
    code: string;
    discountAmount?: number;
    discount?: number;
  };
  product?: {
    productId: string;
    name: string;
  };
  pricing?: {
    currency: string;
    originalAmount: number;
    discountAmount: number;
    payableAmount: number;
  };
  code?: string;
  discount?: number;
  originalAmount?: number;
  payableAmount?: number;
}

declare global {
  interface Window {
    Razorpay?: new (
      options: Record<string, unknown>,
    ) => RazorpayInstance;
  }
}

function prefix(business: Business) {
  if (business === "TRILLION_TRADING") {
    return "/api/trillion";
  }

  if (business === "RIGHT_ALGO_TRADING") {
    return "/api/right-algo";
  }

  throw new ApiError("Invalid business.");
}

export const paymentService = {
  

  validateCoupon: async (
    business: Business,
    product: Product,
    code: string,
  ) => {
    if (
      business === "RIGHT_ALGO_TRADING" &&
      product !== "RIGHT_SOFTWARE"
    ) {
      throw new ApiError(
        "Coupons are available for Right Algo software purchases only.",
      );
    }

    const endpoint =
      business === "TRILLION_TRADING"
        ? "/api/coupons/validate"
        : "/api/right-algo/coupons/validate";

    const result = await post<{
      success: boolean;
      message?: string;
      coupon?: {
        code: string;
        discountAmount: number;
      };
      pricing?: {
        originalAmount: number;
        discountAmount: number;
        payableAmount: number;
        currency: string;
      };
    }>(endpoint, {
      code: code.trim(),
      productId: product,
    });

    if (
      result.success !== true ||
      !result.coupon ||
      !result.pricing
    ) {
      throw new ApiError(
        result.message ?? "This code is invalid or expired.",
      );
    }

    return {
      valid: true,
      code: result.coupon.code,
      discount: result.pricing.discountAmount,
      originalAmount: result.pricing.originalAmount,
      payableAmount: result.pricing.payableAmount,
      message: result.message,
    };
  },


  createOrder: (
    business: Business,
    product: Product,
    customer: Customer,
    coupon?: string,
    registrationId?: string,
  ) => {
    if (
      (business === "RIGHT_ALGO_TRADING") !==
      (product === "REGISTRATION" || product === "RIGHT_SOFTWARE")
    ) {
      throw new ApiError("Product and business do not match.");
    }

    return post<PaymentOrder>(
      `${prefix(business)}/payments/create-order`,
      {
        productId: product,
        name: customer.name,
        email: customer.email,
        phone: customer.mobile,
        couponCode: coupon,
        registrationId,
      },
    ).then((order) => {
      if (
        order.business !== business ||
        !order.keyId ||
        !order.orderId ||
        !Number.isSafeInteger(order.amount) ||
        order.amount <= 0
      ) {
        throw new ApiError(
          "Payment order details could not be validated. Please contact support.",
        );
      }

      return order;
    });
  },

  verify: (
    business: Business,
    response: PaymentResponse,
  ) =>
    post<VerifiedOrder>(
      `${prefix(business)}/payments/verify`,
      response,
    ),

  
  getOrder: (business, id) =>
    api<VerifiedOrder>(
      business === "TRILLION_TRADING"
        ? `/api/trillion/payments/orders/${encodeURIComponent(id)}`
        : `${prefix(business)}/orders/${encodeURIComponent(id)}`
    ),


  receipt: (id: string) =>
    api<{ url: string }>(
      `/api/trillion/receipts/${encodeURIComponent(id)}`,
    ),

  async checkout(
    order: PaymentOrder,
    customer: Customer,
  ): Promise<VerifiedOrder> {
    if (!window.Razorpay) {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement("script");

        script.src =
          "https://checkout.razorpay.com/v1/checkout.js";

        script.onload = () => resolve();

        script.onerror = () =>
          reject(
            new ApiError("Payment checkout could not load."),
          );

        document.head.appendChild(script);
      });
    }

    const Razorpay = window.Razorpay;

    if (!Razorpay) {
      throw new ApiError("Payment checkout is unavailable.");
    }

    return new Promise((resolve, reject) => {
      const checkout = new Razorpay({
        key: order.keyId,
        order_id: order.orderId,
        amount: order.amount,
        currency: order.currency,

        name:
          order.business === "TRILLION_TRADING"
            ? "Trillion Trading"
            : "Right Algo Trading",

        prefill: {
          name: customer.name,
          email: customer.email,
          contact: customer.mobile,
        },

        handler: async (response: PaymentResponse) => {
          try {
            const verified = await paymentService.verify(
              order.business,
              response,
            );

            if (
              !verified.verified ||
              verified.business !== order.business ||
              verified.orderId !== order.orderId
            ) {
              throw new ApiError(
                "Payment is pending verification. Please contact support before paying again.",
              );
            }

            resolve(verified);
          } catch (error) {
            reject(error);
          }
        },

        modal: {
          ondismiss: () =>
            reject(
              new ApiError(
                "Payment checkout was closed. No purchase has been confirmed.",
              ),
            ),
        },
      });

      checkout.on("payment.failed", () =>
        reject(
          new ApiError(
            "Payment failed. Please check your payment status before trying again.",
          ),
        ),
      );

      checkout.open();
    });
  },
};
