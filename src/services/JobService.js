import http from "../api/http";

export const getCustomerDropdown = async () => {
  const response = await http.get("/api/AllDropdown/getcustomer");

  return response.data;
};

export const getProductTypes = async () => {
  const response = await http.get("/api/AllDropdown/product-types");

  return response.data;
};

export const createJob = async (payload) => {
  const response = await http.post("/api/JobRegistration/create", payload);

  return response.data;
};

export const getJobList = async (params = {}, options = {}) => {
  const queryParams = {
    pageSize: params.pageSize ?? 10,
    pageNumber: params.pageNumber ?? 1,
    searchKey: params.searchKey ?? "",
  };

  ["status", "customerId", "productId", "staffId"].forEach((key) => {
    const value = params[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      queryParams[key] = value;
    }
  });

  const response = await http.get("/api/JobRegistration/list", {
    params: queryParams,
    signal: options.signal,
  });

  return response.data;
};

export const getJobById = async (id, options = {}) => {
  const response = await http.get(`/api/JobRegistration/detail/${id}`, {
    signal: options.signal,
  });

  return response.data;
};

export const getCustomerByMobile = async (mobile, options = {}) => {
  const response = await http.get("/api/AllDropdown/getcustomerbymobile", {
    params: {
      mobile,
    },
    signal: options.signal,
  });

  return response.data;
};

export const updateJob = async (payload) => {
  const response = await http.put("/api/JobRegistration/update", payload);

  return response.data;
};

export const deleteProduct = async (id) => {
  const response = await http.delete(`/api/ProductRegistration/delete/${id}`);

  return response.data;
};
