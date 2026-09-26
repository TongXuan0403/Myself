export type Collection = {
  id: number;
  slug: string;
  title: string;
  description: string;
  audience: string;
  stages: string[];
  count: number;
  done: number;
  color: string;
  updated: string;
};

export type ProjectStatus = "构思中" | "开发中" | "已上线";

export type Project = {
  id: number;
  name: string;
  slug: string;
  summary: string;
  status: ProjectStatus;
  stack: string[];
  result: string;
  updated: string;
  link: string;
};

export type Note = {
  id: number;
  date: string;
  type: string;
  title: string;
  summary: string;
  tags: string[];
};

export type WorkspaceContent = {
  collections: Collection[];
  projects: Project[];
  notes: Note[];
};
