#!/usr/bin/env tsx
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seed() {
    console.log("[Database] Connected for seeding departments");

    // 1. Define Departments
    const deptList = [
        { name: "Engineering", description: "Software development and engineering" },
        { name: "Human Resources", description: "Employee management and recruitment" },
        { name: "Finance", description: "Financial planning and accounting" },
        { name: "Sales & Marketing", description: "Revenue generation and brand management" },
        { name: "Operations", description: "Day-to-day business operations" },
    ];

    console.log("Seeding departments...");
    for (const dept of deptList) {
        await prisma.department.upsert({
            where: { name: dept.name },
            create: { name: dept.name, description: dept.description },
            update: { description: dept.description },
        });
        console.log(`✅ Department: ${dept.name}`);
    }

    // 2. Map existing HODs to departments (if any exist)
    const allDepartments = await prisma.department.findMany();
    const hods = await prisma.user.findMany({
        where: { role: "head_of_department" },
    });

    for (const hod of hods) {
        // Try to find a matching department based on the HOD's existing departmentId
        const matchingDept = hod.departmentId
            ? allDepartments.find((d: any) => d.id === hod.departmentId)
            : allDepartments.find((d: any) => d.name === "Engineering"); // default fallback

        if (matchingDept) {
            await prisma.department.update({
                where: { id: matchingDept.id },
                data: { hodId: hod.id },
            });

            if (!hod.departmentId) {
                await prisma.user.update({
                    where: { id: hod.id },
                    data: { departmentId: matchingDept.id },
                });
            }

            console.log(`✅ Assigned HOD ${hod.name} to ${matchingDept.name}`);
        }
    }

    // 3. Update other users with a default department if they don't have one
    const defaultDept = allDepartments.find((d: any) => d.name === "Engineering");
    if (defaultDept) {
        await prisma.user.updateMany({
            where: { departmentId: null },
            data: { departmentId: defaultDept.id },
        });
        console.log(`✅ Assigned default department (Engineering) to users without one.`);
    }

    console.log("Department seeding complete.");
    await prisma.$disconnect();
    process.exit(0);
}

seed().catch(async (e) => {
    console.error("Seed failed:", e);
    await prisma.$disconnect();
    process.exit(1);
});
