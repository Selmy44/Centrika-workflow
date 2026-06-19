#!/usr/bin/env tsx
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seed() {
    console.log("[Database] Connected for seeding asset workflow");

    // 1. Create Workflow Config for 'asset'
    const config = await prisma.workflowConfig.upsert({
        where: { requestType: "asset" },
        create: {
            requestType: "asset",
            name: "Asset Approval Workflow",
            description: "Standard workflow for asset/property requests",
            isActive: true,
        },
        update: {
            name: "Asset Approval Workflow",
        },
    });

    const configId = config.id;
    console.log(`✅ Workflow config created/updated with ID: ${configId}`);

    // 2. Clear existing steps for this config (for idempotency)
    await prisma.workflowStep.deleteMany({
        where: { workflowConfigId: configId },
    });

    // 3. Define Steps
    const stepsData = [
        {
            workflowConfigId: configId,
            stepOrder: 1,
            stepName: "HOD Approval",
            roleResponsible: "head_of_department" as const,
            statusLabel: "Pending HOD Approval",
            isFinal: false,
        },
        {
            workflowConfigId: configId,
            stepOrder: 2,
            stepName: "Head of Finance Approval",
            roleResponsible: "head_of_finance" as const,
            statusLabel: "Pending Head of Finance Approval",
            isFinal: true,
            notifyRoles: "head_of_finance",
        },
    ];

    for (const step of stepsData) {
        const insertedStep = await prisma.workflowStep.create({
            data: step,
        });
        console.log(`✅ Created step: ${step.stepName} (ID: ${insertedStep.id})`);

        // 4. Add escalation rule for Finance step
        if (step.stepName === "Head of Finance Approval") {
            await prisma.escalationRule.create({
                data: {
                    workflowStepId: insertedStep.id,
                    conditionColumn: "estimatedCost",
                    conditionOperator: ">",
                    conditionValue: "1000000", // 1,000,000 RWF threshold
                    targetRole: "ceo_md",
                    notifyRoles: "ceo_md",
                },
            });
            console.log(`✅ Added escalation rule for Finance: > 1,000,000 RWF -> MD`);
        }
    }

    console.log("Asset workflow seeding complete.");
    await prisma.$disconnect();
    process.exit(0);
}

seed().catch(async (e) => {
    console.error("Seed failed:", e);
    await prisma.$disconnect();
    process.exit(1);
});
