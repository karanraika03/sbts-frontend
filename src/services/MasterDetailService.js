import http from "../api/http";

// GET: Master Type Detail List
export const getMasterTypeDetailList = async (params = {}) => {
  const response = await http.get("/api/MasterTypeDetail/list", {
    params,
  });
  return response.data;
};

// GET: Master Type Detail By ID
export const getMasterTypeDetailById = async (id) => {
  const response = await http.get(`/api/MasterTypeDetail/update/${id}`);
  return response.data;
};

// POST: Create Master Type Detail
export const createMasterTypeDetail = async (payload) => {
  const response = await http.post("/api/MasterTypeDetail/create", payload);
  return response.data;
};

// PUT: Update Master Type Detail
export const updateMasterTypeDetail = async (payload) => {
  const response = await http.put("/api/MasterTypeDetail/update", payload);
  return response.data;
};

// DELETE: Master Type Detail
export const deleteMasterTypeDetail = async (id) => {
  const response = await http.delete(`/api/MasterTypeDetail/delete/${id}`);
  return response.data;
};
