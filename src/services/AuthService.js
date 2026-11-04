import http from "../api/http";
import { ENDPOINTS } from "../api/endpoints";

export const login = async (userName, password) => {
  const response = await http.post(ENDPOINTS.AUTH.LOGIN, {
    userName,
    password,
  });

  return response.data;
};
