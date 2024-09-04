export type ServerRouter = "job" | "task" | "file" | "proxy"

export type UserMode = "free" | "mono" | "hub"

export type JobStatus = "pending" | "running" | "done" | "failed" | "canceled"

export interface TaskArg {
  name: string,
  type: string,
  range: Array<string | number> | null,
  default: string | null,
}

export interface Task {
  name: string,
  description: string,
  args: Array<TaskArg>,
}

export interface JobAttr {
  cmd?: string,
  address?: string,
}

export interface Job {
  id: string,
  status: JobStatus,
  name: string,
  job_type: string,
  check_time: string,
  created_time: string,
  submit_time: string | null,
  stoped_time: string | null,
  condition: Condition | null
  attrs: JobAttr,
}

export interface Condition {
  type: string,
  arguments: ConditionAfterAnoter
}

export interface ConditionAfterAnoter {
  job_id: string,
  statuses: JobStatus[]
}

export type PanelLabel =
| "home"
| "design"
| "genome"
| "task"
| "tutorial"
| "profile"
| "myaccount"
| "addaccount"
| "settings"
| "logout"
| "customprobe"
| "designworkflow";

export interface Folder {
  id: string,
  name: string,
}

export type FolderChain = Array<Folder>

export interface CallReq {
  task_name: string,
  args: any[],
  kwargs: object,
  condition: Condition | null
}

export type JobModify = "re_run" | "cancel" | "remove"

export interface UserInfo {
  id: number,
  username: string,
  role: string,
}

export interface UserInfo {
  name: string;
  email: string;
  joinDate: string;
  probesDesigned: number;
  avatarUrl: string;
}

export interface HistoryItem {
  id: number;
  action: string;
  date: string;
}