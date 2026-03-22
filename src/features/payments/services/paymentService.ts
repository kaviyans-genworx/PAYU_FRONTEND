import core_axios_intance from "@/lib/axios";
import type {
  AcceptForPaymentResponse,
  PaymentSummary,
  PaymentDetail,
  PayNowResponse,
} from "@/types/documents";


export const paymentService = {
  async acceptForPayment(groupId: number): Promise<AcceptForPaymentResponse> {
    const { data } = await core_axios_intance.post<AcceptForPaymentResponse>(
      `/api/payments/groups/${groupId}/accept`,
    );
    return data;
  },

  async listPayments(): Promise<PaymentSummary[]> {
    const { data } = await core_axios_intance.get<PaymentSummary[]>(
      `/api/payments/`,
    );
    return data;
  },

  async getPaymentDetail(groupId: number): Promise<PaymentDetail> {
    const { data } = await core_axios_intance.get<PaymentDetail>(
      `/api/payments/${groupId}`,
    );
    return data;
  },

  async processPayment(groupId: number): Promise<PayNowResponse> {
    const { data } = await core_axios_intance.post<PayNowResponse>(
      `/api/payments/${groupId}/pay`,
    );
    return data;
  },
};
