import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Checking Supabase configuration...\n');

  // 環境変数の確認
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  const databaseUrl = process.env.DATABASE_URL;

  console.log('📋 Environment Variables:');
  console.log(`  SUPABASE_URL: ${supabaseUrl ? '✅ Set' : '❌ Missing'}`);
  console.log(`  SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceRoleKey ? '✅ Set' : '❌ Missing'}`);
  console.log(`  SUPABASE_ANON_KEY: ${supabaseAnonKey ? '✅ Set' : '❌ Missing'}`);
  console.log(`  DATABASE_URL: ${databaseUrl ? '✅ Set' : '❌ Missing'}`);
  console.log('');

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('❌ Missing required Supabase environment variables');
    return;
  }

  // Supabaseクライアントの作成
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // 1. Supabase接続テスト
  console.log('🔌 Testing Supabase connection...');
  try {
    const { data: users, error: listError } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1,
    });

    if (listError) {
      console.error(`❌ Supabase connection failed: ${listError.message}`);
      console.error(`   Error details: ${JSON.stringify(listError, null, 2)}`);
    } else {
      console.log('✅ Supabase connection successful');
      console.log(`   Found ${users?.users?.length || 0} users in Supabase Auth`);
    }
  } catch (error: any) {
    console.error(`❌ Supabase connection error: ${error.message}`);
  }
  console.log('');

  // 2. データベース接続テスト
  console.log('🔌 Testing database connection...');
  try {
    const userCount = await prisma.user.count();
    console.log(`✅ Database connection successful`);
    console.log(`   Found ${userCount} users in database`);
  } catch (error: any) {
    console.error(`❌ Database connection failed: ${error.message}`);
    if (error.message.includes('P1001')) {
      console.error('   This usually means the database server is not reachable');
      console.error('   Check your DATABASE_URL and ensure the database is accessible');
    }
  }
  console.log('');

  // 3. Supabase Authユーザー一覧
  console.log('👥 Listing Supabase Auth users...');
  try {
    const { data: authUsers, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error(`❌ Failed to list users: ${listError.message}`);
    } else {
      const users = authUsers?.users || [];
      console.log(`✅ Found ${users.length} users in Supabase Auth:`);
      users.slice(0, 10).forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.email} (ID: ${user.id})`);
        console.log(`      Created: ${user.created_at}`);
        console.log(`      Email confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}`);
      });
      if (users.length > 10) {
        console.log(`   ... and ${users.length - 10} more users`);
      }
    }
  } catch (error: any) {
    console.error(`❌ Error listing users: ${error.message}`);
  }
  console.log('');

  // 4. データベースユーザー一覧
  console.log('👥 Listing database users...');
  try {
    const dbUsers = await prisma.user.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
    });
    console.log(`✅ Found ${dbUsers.length} users in database:`);
    dbUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email} (ID: ${user.id})`);
      console.log(`      Name: ${user.name}`);
      console.log(`      Created: ${user.createdAt}`);
    });
  } catch (error: any) {
    console.error(`❌ Error listing database users: ${error.message}`);
  }
  console.log('');

  // 5. ユーザーの同期状況確認
  console.log('🔄 Checking user sync status...');
  try {
    const dbUsers = await prisma.user.findMany();
    const { data: authUsers } = await supabase.auth.admin.listUsers();
    const supabaseUserMap = new Map(
      (authUsers?.users || []).map(u => [u.id, u])
    );

    let synced = 0;
    let notSynced = 0;

    for (const dbUser of dbUsers) {
      const supabaseUser = supabaseUserMap.get(dbUser.id);
      if (supabaseUser) {
        synced++;
      } else {
        notSynced++;
        console.log(`   ⚠️  User ${dbUser.email} (${dbUser.id}) not found in Supabase Auth`);
      }
    }

    console.log(`✅ Sync status: ${synced} synced, ${notSynced} not synced`);
    if (notSynced > 0) {
      console.log(`   💡 Run 'npm run db:sync-supabase' to sync users`);
    }
  } catch (error: any) {
    console.error(`❌ Error checking sync status: ${error.message}`);
  }
  console.log('');

  // 6. Supabase設定の確認
  console.log('⚙️  Checking Supabase configuration...');
  try {
    const { data: settings, error: settingsError } = await supabase.auth.admin.listUsers();
    
    if (settingsError) {
      console.error(`❌ Failed to check settings: ${settingsError.message}`);
    } else {
      console.log('✅ Supabase Auth is accessible');
      console.log(`   Service role key is valid`);
    }
  } catch (error: any) {
    console.error(`❌ Error checking settings: ${error.message}`);
  }
  console.log('');

  console.log('✅ Check completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


