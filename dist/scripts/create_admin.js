"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new client_1.PrismaClient();
async function main() {
    const email = 'admin@gmail.com';
    const plainPassword = '123456';
    const hashedPassword = await bcrypt.hash(plainPassword, 10);
    const admin = await prisma.admin.upsert({
        where: { email },
        update: {
            password: hashedPassword,
            role: client_1.Role.SUPERADMIN,
            isActive: true,
        },
        create: {
            name: 'Admin User',
            email,
            password: hashedPassword,
            role: client_1.Role.SUPERADMIN,
            permissions: ['ALL'],
            isActive: true,
        },
    });
    console.log('✅ Admin user successfully upserted:');
    console.log('   Email:', admin.email);
    console.log('   Role:', admin.role);
}
main()
    .catch((e) => {
    console.error('❌ Error creating admin user:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=create_admin.js.map