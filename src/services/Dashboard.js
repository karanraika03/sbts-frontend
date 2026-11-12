import http from "../api/http";

export const getDashboardData = async () => {
  const response = await http.get("/api/Home/dashboard");
  return response.data;
};

export const getOverdueDeliveries = async () => {
  const response = await http.get("/api/Home/overdue-deliveries");
  return response.data;
};

export const getCustomerCityCount = async () => {
  const response = await http.get("/api/Home/customer-city-count");
  return response.data;
};

export const getJobRevenue = async () => {
  const response = await http.get("/api/Home/job-revenue");
  return response.data;
};
