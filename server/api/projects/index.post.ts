import { ProjectRepositoryImpl } from '../../../infrastructure/project/projectRepositoryImpl';
import { CreateProject } from '../../../application/project/useCases/CreateProject';
import { JwtService } from '../../../infrastructure/auth/jwtService';
import { UserRepositoryImpl } from '../../../infrastructure/auth/userRepositoryImpl';
import { CreateProjectInput } from '../../../application/project/dto/CreateProjectInput';
import { UserType } from '../../../domain/user/model/UserType';
import { z } from 'zod';

const projectRepository = new ProjectRepositoryImpl();
const createProjectUseCase = new CreateProject(projectRepository);
const userRepository = new UserRepositoryImpl();
const jwtService = new JwtService();

const createProjectSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
});

async function getCurrentUser(event: any) {
  const accessTokenCookie = getCookie(event, 'accessToken');
  if (!accessTokenCookie) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    });
  }

  try {
    const { userId } = jwtService.verifyAccessToken(accessTokenCookie);
    const user = await userRepository.findById(userId);
    
    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized',
      });
    }

    return user;
  } catch (error: any) {
    if (error.statusCode) {
      throw error;
    }
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    });
  }
}

function isAdministratorOrMember(userType: number): boolean {
  return userType === UserType.ADMINISTRATOR || userType === UserType.MEMBER;
}

export default defineEventHandler(async (event) => {
  const currentUser = await getCurrentUser(event);

  // 管理者・メンバーのみアクセス可能
  if (!isAdministratorOrMember(currentUser.userType.toNumber())) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden: Administrator or Member access required',
    });
  }

  const body = await readBody(event);

  try {
    const validationResult = createProjectSchema.safeParse(body);
    if (!validationResult.success) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Validation error',
        data: validationResult.error.errors,
      });
    }

    const input = new CreateProjectInput(
      validationResult.data.name,
      validationResult.data.description
    );

    const result = await createProjectUseCase.execute(input);

    return result;
  } catch (error: any) {
    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error',
    });
  }
});

