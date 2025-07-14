// prisma/seed.js

const { PrismaClient } = require('../generated/prisma');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('Bắt đầu quá trình seeding...');

    const password = 'wedding@202602';
    const hashedPassword = await bcrypt.hash(password, 10);

    // Dữ liệu người dùng cần tạo
    const usersToCreate = [
        {
            name: 'luandnh',
            email: 'luandnh@wedding.app',
            passwordHash: hashedPassword,
        },
        {
            name: 'lanphuong',
            email: 'lanphuong@wedding.app',
            passwordHash: hashedPassword,
        },
    ];

    for (const u of usersToCreate) {
        // Sử dụng `upsert` để tránh tạo trùng lặp nếu chạy lại script
        const user = await prisma.user.upsert({
            where: { email: u.email },
            update: {}, // Không làm gì nếu đã tồn tại
            create: u,
        });
        console.log(`Đã tạo hoặc cập nhật người dùng: ${user.name} (${user.email})`);
    }

    console.log('Quá trình seeding hoàn tất.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
