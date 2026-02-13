import axios, { AxiosInstance, AxiosRequestConfig } from "axios";

export interface TalentOSConfig {
  baseUrl: string;
  apiKey?: string;
  accessToken?: string;
  timeout?: number;
}

export class TalentOSClient {
  private http: AxiosInstance;

  constructor(config: TalentOSConfig) {
    this.http = axios.create({
      baseURL: `${config.baseUrl}/api/v1`,
      timeout: config.timeout || 30000,
      headers: {
        "Content-Type": "application/json",
        ...(config.apiKey ? { "X-API-Key": config.apiKey } : {}),
        ...(config.accessToken
          ? { Authorization: `Bearer ${config.accessToken}` }
          : {}),
      },
    });
  }

  setAccessToken(token: string) {
    this.http.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  }

  // Auth
  async register(data: { email: string; password: string; first_name: string; last_name: string; org_name?: string }) {
    return this.http.post("/auth/register", data);
  }

  async login(data: { email: string; password: string }) {
    return this.http.post("/auth/login", data);
  }

  async logout() {
    return this.http.post("/auth/logout");
  }

  async getMe() {
    return this.http.get("/auth/me");
  }

  // Candidates
  async listCandidates(params?: Record<string, unknown>) {
    return this.http.get("/candidates", { params });
  }

  async getCandidate(id: string) {
    return this.http.get(`/candidates/${id}`);
  }

  async createCandidate(data: Record<string, unknown>) {
    return this.http.post("/candidates", data);
  }

  async updateCandidate(id: string, data: Record<string, unknown>) {
    return this.http.patch(`/candidates/${id}`, data);
  }

  // Jobs
  async listJobs(params?: Record<string, unknown>) {
    return this.http.get("/jobs", { params });
  }

  async getJob(id: string) {
    return this.http.get(`/jobs/${id}`);
  }

  async createJob(data: Record<string, unknown>) {
    return this.http.post("/jobs", data);
  }

  async publishJob(id: string) {
    return this.http.post(`/jobs/${id}/publish`);
  }

  // Applications
  async listApplications(params?: Record<string, unknown>) {
    return this.http.get("/applications", { params });
  }

  async applyToJob(jobId: string, data: Record<string, unknown>) {
    return this.http.post(`/jobs/${jobId}/apply`, data);
  }

  async advanceStage(applicationId: string, data: { to_stage: string; notes?: string }) {
    return this.http.post(`/applications/${applicationId}/stage`, data);
  }

  // Conversations
  async listConversations(params?: Record<string, unknown>) {
    return this.http.get("/conversations", { params });
  }

  async createConversation(data: { type: string; title?: string; participant_ids: string[] }) {
    return this.http.post("/conversations", data);
  }

  async getConversationMessages(conversationId: string, params?: Record<string, unknown>) {
    return this.http.get(`/conversations/${conversationId}/messages`, { params });
  }

  async sendMessage(conversationId: string, data: { content: string; message_type?: string }) {
    return this.http.post(`/conversations/${conversationId}/messages`, data);
  }

  // Meetings
  async requestMeeting(data: Record<string, unknown>) {
    return this.http.post("/meetings/request", data);
  }

  async acceptMeeting(meetingId: string, data: { accepted_time: string; timezone: string }) {
    return this.http.post(`/meetings/${meetingId}/accept`, data);
  }

  async denyMeeting(meetingId: string, data?: { reason?: string }) {
    return this.http.post(`/meetings/${meetingId}/deny`, data || {});
  }

  // Video Rooms
  async createVideoRoom(data?: Record<string, unknown>) {
    return this.http.post("/video-rooms", data || {});
  }

  async joinVideoRoom(roomId: string) {
    return this.http.post(`/video-rooms/${roomId}/join`);
  }

  // Subscriptions
  async listPlans() {
    return this.http.get("/plans");
  }

  async getCurrentSubscription() {
    return this.http.get("/subscription");
  }

  async createSubscription(data: { plan_id: string; billing_cycle?: string }) {
    return this.http.post("/subscription", data);
  }
}

export default TalentOSClient;
