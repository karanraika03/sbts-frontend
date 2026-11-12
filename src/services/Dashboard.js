import http from "../api/http";

export const getDashboardData = async () => {
  const response = await http.get("/api/Home/dashboard");
  return response.data;
};

export const getOverdueDeliveries = async () => {
  const response = await http.get("/api/Home/overdue-deliveries");
  return response.data;
};
