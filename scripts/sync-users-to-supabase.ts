import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';

const prisma = new PrismaClient();

async function main() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Missing Supabase environment variables');
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  console.log('🔄 Syncing users to Supabase Auth...');

  // データベースから全ユーザーを取得
  const users = await prisma.user.findMany();

  console.log(`Found ${users.length} users in database`);

  for (const user of users) {
    try {
      // Supabase Authに既に存在するかチェック
      const { data: existingUser } = await supabase.auth.admin.getUserById(user.id);
      
      if (existingUser?.user) {
        console.log(`✓ User ${user.email} already exists in Supabase Auth`);
        continue;
      }

      // メールアドレスで検索
      const { data: userByEmail } = await supabase.auth.admin.listUsers();
      const foundUser = userByEmail?.users?.find(u => u.email === user.email);

      if (foundUser) {
        console.log(`✓ User ${user.email} exists in Supabase Auth with different ID`);
        // 既存のSupabaseユーザーIDでデータベースのユーザーIDを更新
        await prisma.user.update({
          where: { id: user.id },
          data: { id: foundUser.id },
        });
        console.log(`  Updated user ID from ${user.id} to ${foundUser.id}`);
        continue;
      }

      // Supabase Authにユーザーを作成
      // 注意: パスワードは既にハッシュ化されているため、直接設定できない
      // 代わりに、一時パスワードを設定してユーザーにリセットを促す
      const { data: newUser, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: 'password123', // テスト用の一時パスワード（実際のパスワードと同じ）
        email_confirm: true, // メール確認をスキップ
        user_metadata: {
          name: user.name,
        },
      });

      if (error) {
        console.error(`✗ Failed to create user ${user.email}:`, error.message);
        continue;
      }

      if (newUser.user) {
        // データベースのユーザーIDをSupabaseのユーザーIDに更新
        await prisma.user.update({
          where: { id: user.id },
          data: { id: newUser.user.id },
        });
        console.log(`✓ Created user ${user.email} in Supabase Auth (ID: ${newUser.user.id})`);
      }
    } catch (error: any) {
      console.error(`✗ Error processing user ${user.email}:`, error.message);
    }
  }

  console.log('✅ User sync completed');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


