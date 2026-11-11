import http from "../api/http";

export const getDashboardData = async () => {
  const response = await http.get("/api/Home/dashboard");
  return response.data;
};
