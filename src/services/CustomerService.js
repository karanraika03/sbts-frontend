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

export const createCustomer = async (formData) => {
  const response = await http.post("/api/CustomerRegistration", formData);

  return response.data;
};

export const getCustomerById = async (id) => {
  const response = await http.get(`/api/CustomerRegistration/view/${id}`);

  return response.data;
};

export const updateCustomer = async (formData) => {
  const response = await http.post(
    "/api/CustomerRegistration/update",
    formData,
  );

  return response.data;
};

export const getGenders = async () => {
  const response = await http.get("/api/CustomerDropdown/genders");
  return response.data;
};

export const getStates = async () => {
  const response = await http.get("/api/CustomerDropdown/states");
  return response.data;
};
