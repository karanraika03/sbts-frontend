import http from "../api/http";
import { ENDPOINTS } from "../api/endpoints";

export const getCustomerList = async (params = {}) => {
  const response = await http.get("/api/CustomerRegistration/list", {
    params: {
      pageSize: params.pageSize ?? 10,
      pageNumber: params.pageNumber ?? 1,
      ...(params.searchKey && {
        searchKey: params.searchKey,
      }),
      ...(params.masterTypeId != null && {
        masterTypeId: params.masterTypeId,
      }),
      ...(params.activeStatus != null && {
        activeStatus: params.activeStatus,
      }),
      ...(params.favourite != null && {
        favourite: params.favourite,
      }),
      ...(params.headId != null && {
        headId: params.headId,
      }),
      ...(params.Id != null && {
        Id: params.Id,
      }),
    },
  });

  return response.data;
};

export const createCustomer = async (formData) => {
  const response = await http.post(
    "/api/CustomerRegistration/create",
    formData,
  );

  return response.data;
};

export const updateCustomer = async (formData) => {
  const response = await http.put("/api/CustomerRegistration/update", formData);

  return response.data;
};

export const getGenders = async () => {
  const response = await http.get("/api/AllDropdown/genders");
  return response.data;
};

export const getStates = async () => {
  const response = await http.get("/api/AllDropdown/states");
  return response.data;
};

export const getDistricts = async () => {
  const response = await http.get("/api/AllDropdown/district");
  return response.data;
};

export const getCitiesByDistrict = async (districtId) => {
  const response = await http.get(`/api/AllDropdown/city/${districtId}`);
  return response.data;
};

export const deleteCustomer = async (id) => {
  const response = await http.delete(`/api/CustomerRegistration/delete/${id}`);

  return response.data;
};

export const getCustomerById = async (id) => {
  const response = await http.get("/api/CustomerRegistration/list", {
    params: {
      Id: id,
    },
  });

  return response.data;
};
