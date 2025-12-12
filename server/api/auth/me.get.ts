import { UserRepositoryImpl } from '../../../infrastructure/auth/userRepositoryImpl';
import { JwtService } from '../../../infrastructure/auth/jwtService';

const userRepository = new UserRepositoryImpl();
const jwtService = new JwtService();

export default defineEventHandler(async (event) => {
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
        statusCode: 404,
        statusMessage: 'User not found',
      });
    }

    return {
      id: user.id,
      email: user.email.toString(),
      name: user.name,
      userType: user.userType.toNumber(),
    };
  } catch (error: any) {
    if (error.statusCode) {
      throw error;
    }
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    });
  }
});

