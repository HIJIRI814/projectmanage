import { Project } from '../../../domain/project/model/Project';
import { ProjectVisibility } from '../../../domain/project/model/ProjectVisibility';
import { UserType } from '../../../domain/user/model/UserType';
import { IUserCompanyRepository } from '../../../domain/user/repository/IUserCompanyRepository';

export class ProjectAccessService {
  constructor(private userCompanyRepository: IUserCompanyRepository) {}

  /**
   * ユーザーがプロジェクトにアクセスできるかチェック
   * @param project プロジェクト
   * @param userId ユーザーID
   * @param isProjectMember プロジェクトメンバーかどうか
   * @returns アクセス可能かどうか
   */
  async canAccess(
    project: Project,
    userId: string,
    isProjectMember: boolean
  ): Promise<boolean> {
    // プライベート: プロジェクトメンバーのみ
    if (project.visibility.isPrivate()) {
      return isProjectMember;
    }

    // 社内公開: 同じ会社の管理者・メンバーが閲覧・編集可能
    if (project.visibility.isCompanyInternal()) {
      // プロジェクトメンバーは常にアクセス可能
      if (isProjectMember) {
        return true;
      }

      // プロジェクトに所属する会社のユーザーをチェック
      for (const companyId of project.companyIds) {
        const userCompany = await this.userCompanyRepository.findByUserIdAndCompanyId(
          userId,
          companyId
        );

        if (userCompany) {
          const userType = userCompany.userType.toNumber();
          // 管理者・メンバーはアクセス可能
          if (
            userType === UserType.ADMINISTRATOR ||
            userType === UserType.MEMBER
          ) {
            return true;
          }
        }
      }
    }

    // 公開: 今後実装
    if (project.visibility.isPublic()) {
      // 今後実装
      return false;
    }

    return false;
  }

  /**
   * ユーザーがプロジェクトを編集できるかチェック
   * @param project プロジェクト
   * @param userId ユーザーID
   * @param isProjectMember プロジェクトメンバーかどうか
   * @returns 編集可能かどうか
   */
  async canEdit(
    project: Project,
    userId: string,
    isProjectMember: boolean
  ): Promise<boolean> {
    // プロジェクトメンバーは常に編集可能
    if (isProjectMember) {
      return true;
    }

    // 社内公開: 同じ会社の管理者・メンバーが編集可能
    if (project.visibility.isCompanyInternal()) {
      for (const companyId of project.companyIds) {
        const userCompany = await this.userCompanyRepository.findByUserIdAndCompanyId(
          userId,
          companyId
        );

        if (userCompany) {
          const userType = userCompany.userType.toNumber();
          // 管理者・メンバーは編集可能
          if (
            userType === UserType.ADMINISTRATOR ||
            userType === UserType.MEMBER
          ) {
            return true;
          }
        }
      }
    }

    return false;
  }
}

