import core_axios_intance from "@/lib/axios";
import type {
  DiscrepancyMailDraft,
  DiscrepancyMailSendPayload,
  DiscrepancyMailSendResponse,
  ValidationGroupSummary,
  ValidationGroupDetail,
  ValidationResultsOut,
  MappedItemsOut,
} from "@/types/documents";


export const validationService = {
  async listGroups(): Promise<ValidationGroupSummary[]> {
    const { data } = await core_axios_intance.get<ValidationGroupSummary[]>(
      `/api/validations/groups`,
    );
    return data;
  },

  async getGroupDetail(groupId: number): Promise<ValidationGroupDetail> {
    const { data } = await core_axios_intance.get<ValidationGroupDetail>(
      `/api/validations/groups/${groupId}`
    );
    return data;
  },

  async getGroupResults(groupId: number): Promise<ValidationResultsOut> {
    const { data } = await core_axios_intance.get<ValidationResultsOut>(
      `/api/validations/groups/${groupId}/results`
    );
    return data;
  },

  async getMappedItems(groupId: number): Promise<MappedItemsOut> {
    const { data } = await core_axios_intance.get<MappedItemsOut>(
      `/api/validations/groups/${groupId}/mapped-items`
    );
    return data;
  },

  async getDiscrepancyMailDraft(groupId: number): Promise<DiscrepancyMailDraft> {
    const { data } = await core_axios_intance.get<DiscrepancyMailDraft>(
      `/api/validations/groups/${groupId}/discrepancy-mail-draft`
    );
    return data;
  },

  async sendDiscrepancyMail(
    groupId: number,
    payload: DiscrepancyMailSendPayload,
  ): Promise<DiscrepancyMailSendResponse> {
    const { data } = await core_axios_intance.post<DiscrepancyMailSendResponse>(
      `/api/validations/groups/${groupId}/send-discrepancy-mail`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return data;
  },
};
