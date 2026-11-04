import http from "../api/http";
import { ENDPOINTS } from "../api/endpoints";

export const getCustomerList = async (params = {}) => {
  const response = await http.get(ENDPOINTS.CUSTOMER.LIST, {
    params: {
      pageSize: params.pageSize ?? 10,
      pageNumber: params.pageNumber ?? 1,
      ...(params.headId != null && { headId: params.headId }),
      ...(params.masterTypeId != null && {
        masterTypeId: params.masterTypeId,
      }),
      ...(params.searchKey && { searchKey: params.searchKey }),
      ...(params.activeStatus != null && {
        activeStatus: params.activeStatus,
      }),
      ...(params.favourite != null && {
        favourite: params.favourite,
      }),
    },
  });

  return response.data;
};
