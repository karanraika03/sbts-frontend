import http from "../api/http";

// GET: Master Type List
export const getMasterTypeList = async (params = {}) => {
  const response = await http.get("/api/MasterType/list", {
    params,
  });
  return response.data;
};

// GET: Master Type By ID
export const getMasterTypeById = async (id) => {
  const response = await http.get(`/api/MasterType/update/${id}`);
  return response.data;
};

// POST: Create Master Type
export const createMasterType = async (payload) => {
  const response = await http.post("/api/MasterType/create", payload);
  return response.data;
};

// PUT: Update Master Type
export const updateMasterType = async (payload) => {
  const response = await http.put("/api/MasterType/update", payload);
  return response.data;
};

// DELETE: Master Type
export const deleteMasterType = async (id) => {
  const response = await http.delete(`/api/MasterType/delete/${id}`);
  return response.data;
};
