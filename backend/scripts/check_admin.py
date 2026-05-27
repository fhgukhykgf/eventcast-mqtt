from utils.database import get_database
import asyncio

async def check_admin():
    db = await get_database()
    user = await db['users'].find_one({'user_id': 'admin'})
    print('Admin user found:', user is not None)
    if user:
        print('User:', user['user_id'], user.get('username'))
    
    # 检查是否有其他用户
    users = await db['users'].find().to_list(10)
    print('Total users:', len(users))
    for u in users:
        print('User:', u['user_id'], u.get('username'), u.get('role'))

if __name__ == '__main__':
    asyncio.run(check_admin())
