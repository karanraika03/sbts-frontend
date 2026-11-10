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

export const getJobList = async (params = {}) => {
  const response = await http.get("/api/JobRegistration/list", {
    params: {
      pageSize: params.pageSize ?? 10,
      pageNumber: params.pageNumber ?? 1,
      ...(params.searchKey && { searchKey: params.searchKey }),
      ...(params.status != null && { status: params.status }),
      ...(params.customerId != null && {
        customerId: params.customerId,
      }),
      ...(params.productId != null && {
        productId: params.productId,
      }),
      ...(params.staffId != null && {
        staffId: params.staffId,
      }),
    },
  });

  return response.data;
};

export const deleteJob = async (id) => {
  const response = await http.delete(`/api/JobRegistration/delete/${id}`);

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
