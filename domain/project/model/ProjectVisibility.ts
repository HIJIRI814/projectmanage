export enum ProjectVisibility {
  PRIVATE = 'PRIVATE', // プライベート（プロジェクトメンバーのみ）
  COMPANY_INTERNAL = 'COMPANY_INTERNAL', // 社内公開（同じ会社の管理者・メンバーが閲覧・編集可能）
  PUBLIC = 'PUBLIC', // 公開（今後実装）
}

export const ProjectVisibilityLabel: Record<ProjectVisibility, string> = {
  [ProjectVisibility.PRIVATE]: 'プライベート',
  [ProjectVisibility.COMPANY_INTERNAL]: '社内公開',
  [ProjectVisibility.PUBLIC]: '公開',
};

export class ProjectVisibilityValue {
  private readonly value: ProjectVisibility;

  constructor(value: ProjectVisibility) {
    if (!Object.values(ProjectVisibility).includes(value)) {
      throw new Error('Invalid project visibility');
    }
    this.value = value;
  }

  static fromString(value: string): ProjectVisibilityValue {
    if (!Object.values(ProjectVisibility).includes(value as ProjectVisibility)) {
      throw new Error('Invalid project visibility');
    }
    return new ProjectVisibilityValue(value as ProjectVisibility);
  }

  toString(): string {
    return this.value;
  }

  getLabel(): string {
    return ProjectVisibilityLabel[this.value];
  }

  equals(other: ProjectVisibilityValue): boolean {
    return this.value === other.value;
  }

  isPrivate(): boolean {
    return this.value === ProjectVisibility.PRIVATE;
  }

  isCompanyInternal(): boolean {
    return this.value === ProjectVisibility.COMPANY_INTERNAL;
  }

  isPublic(): boolean {
    return this.value === ProjectVisibility.PUBLIC;
  }
}

