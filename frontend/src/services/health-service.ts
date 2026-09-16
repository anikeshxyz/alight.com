import { apiClient } from "./api-client";
import { HealthData, ApiResponse } from "@/types";

export async function fetchHealthStatus(): Promise<ApiResponse<HealthData>> {
  return apiClient<HealthData>("/health");
}
