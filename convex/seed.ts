import { internalMutation } from "./_generated/server";

export const seedDatabase = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Check if already seeded
    const existingUsers = await ctx.db.query("users").collect();
    if (existingUsers.length > 0) {
      console.log("Database already seeded, skipping.");
      return;
    }

    // ── Users ──
    const adminId = await ctx.db.insert("users", {
      clerkId: "clerk_admin_sarah",
      name: "Sarah Chen",
      email: "sarah.chen@hopefoundation.org",
      phone: "+1-512-555-0142",
      avatarUrl: undefined,
      role: "Admin",
      department: "Finance",
      isActive: true,
      lastLoginAt: 1774560000000,
      createdAt: 1735689600000,
      updatedAt: 1774560000000,
    });

    const approverId = await ctx.db.insert("users", {
      clerkId: "clerk_approver_marcus",
      name: "Marcus Johnson",
      email: "marcus.johnson@hopefoundation.org",
      phone: "+1-512-555-0287",
      avatarUrl: undefined,
      role: "Approver",
      department: "Programs",
      isActive: true,
      lastLoginAt: 1774473600000,
      createdAt: 1735689600000,
      updatedAt: 1774473600000,
    });

    const submitterId = await ctx.db.insert("users", {
      clerkId: "clerk_submitter_emily",
      name: "Emily Rivera",
      email: "emily.rivera@hopefoundation.org",
      phone: "+1-512-555-0193",
      avatarUrl: undefined,
      role: "Submitter",
      department: "Programs",
      isActive: true,
      lastLoginAt: 1774387200000,
      createdAt: 1738368000000,
      updatedAt: 1774387200000,
    });

    // ── Categories (inserted before budget lines, linked after) ──
    const categoryTravelId = await ctx.db.insert("categories", {
      name: "Travel",
      description: "Transportation, lodging, meals, and per diem for work-related travel",
      code: "TRV",
      isActive: true,
      budgetLineId: undefined,
      createdAt: 1735689600000,
    });

    const categoryOfficeId = await ctx.db.insert("categories", {
      name: "Office Supplies",
      description: "Pens, paper, printer ink, filing supplies, and general office materials",
      code: "OFS",
      isActive: true,
      budgetLineId: undefined,
      createdAt: 1735689600000,
    });

    const categoryProgramId = await ctx.db.insert("categories", {
      name: "Program Costs",
      description: "Direct costs for program delivery including materials, venue rental, and participant supplies",
      code: "PGM",
      isActive: true,
      budgetLineId: undefined,
      createdAt: 1735689600000,
    });

    const categoryTrainingId = await ctx.db.insert("categories", {
      name: "Training",
      description: "Staff professional development, conference registrations, and training materials",
      code: "TRN",
      isActive: true,
      budgetLineId: undefined,
      createdAt: 1735689600000,
    });

    const categoryEquipmentId = await ctx.db.insert("categories", {
      name: "Equipment",
      description: "Computers, monitors, furniture, and durable goods over $250",
      code: "EQP",
      isActive: true,
      budgetLineId: undefined,
      createdAt: 1735689600000,
    });

    // ── Budget Lines ──
    const budgetTravelId = await ctx.db.insert("budgetLines", {
      name: "FY2026 Travel - Programs",
      categoryId: categoryTravelId,
      fiscalYear: "FY2026",
      budgetedAmount: 15000.0,
      spentAmount: 3247.85,
      remainingAmount: 11752.15,
      department: "Programs",
      notes: "Includes field visits to partner sites and annual conference attendance",
      createdAt: 1735689600000,
    });

    const budgetOfficeId = await ctx.db.insert("budgetLines", {
      name: "FY2026 Office Supplies - Finance",
      categoryId: categoryOfficeId,
      fiscalYear: "FY2026",
      budgetedAmount: 3500.0,
      spentAmount: 842.17,
      remainingAmount: 2657.83,
      department: "Finance",
      notes: undefined,
      createdAt: 1735689600000,
    });

    const budgetProgramId = await ctx.db.insert("budgetLines", {
      name: "FY2026 Program Costs - Programs",
      categoryId: categoryProgramId,
      fiscalYear: "FY2026",
      budgetedAmount: 45000.0,
      spentAmount: 12389.5,
      remainingAmount: 32610.5,
      department: "Programs",
      notes: "Youth mentorship program and community workshops",
      createdAt: 1735689600000,
    });

    const budgetTrainingId = await ctx.db.insert("budgetLines", {
      name: "FY2026 Training - Programs",
      categoryId: categoryTrainingId,
      fiscalYear: "FY2026",
      budgetedAmount: 8000.0,
      spentAmount: 1575.0,
      remainingAmount: 6425.0,
      department: "Programs",
      notes: "Staff certifications and annual nonprofit leadership summit",
      createdAt: 1735689600000,
    });

    const budgetEquipmentId = await ctx.db.insert("budgetLines", {
      name: "FY2026 Equipment - Finance",
      categoryId: categoryEquipmentId,
      fiscalYear: "FY2026",
      budgetedAmount: 10000.0,
      spentAmount: 2149.98,
      remainingAmount: 7850.02,
      department: "Finance",
      notes: "Laptop replacements and office printer",
      createdAt: 1735689600000,
    });

    // ── Link categories to budget lines ──
    await ctx.db.patch(categoryTravelId, { budgetLineId: budgetTravelId });
    await ctx.db.patch(categoryOfficeId, { budgetLineId: budgetOfficeId });
    await ctx.db.patch(categoryProgramId, { budgetLineId: budgetProgramId });
    await ctx.db.patch(categoryTrainingId, { budgetLineId: budgetTrainingId });
    await ctx.db.patch(categoryEquipmentId, { budgetLineId: budgetEquipmentId });

    // ── Expense Reports ──
    const report1Id = await ctx.db.insert("expenseReports", {
      title: "March 2026 Austin Partner Visit",
      description: "Travel expenses for Q1 partner site visit in Austin, TX",
      submittedById: submitterId,
      approverId: approverId,
      totalAmount: 799.8,
      status: "Submitted",
      submittedAt: 1774041600000,
      reviewedAt: undefined,
      reviewNotes: undefined,
      period: "March 2026",
      createdAt: 1773868800000,
      updatedAt: 1774041600000,
    });

    const report2Id = await ctx.db.insert("expenseReports", {
      title: "Q1 2026 Training & Program Expenses",
      description: "Conference registration and program supply costs for Q1",
      submittedById: approverId,
      approverId: undefined,
      totalAmount: 731.73,
      status: "Draft",
      submittedAt: undefined,
      reviewedAt: undefined,
      reviewNotes: undefined,
      period: "Q1 2026",
      createdAt: 1774214400000,
      updatedAt: 1774300800000,
    });

    // ── Expenses ──
    const expense1Id = await ctx.db.insert("expenses", {
      title: "Flight to Austin Partner Meeting",
      description: "Round-trip flight SFO to AUS for Q1 partner site visit",
      amount: 487.32,
      date: 1773868800000,
      categoryId: categoryTravelId,
      receiptUrl: undefined,
      merchant: "Southwest Airlines",
      paymentMethod: "CreditCard",
      reportId: report1Id,
      submittedById: submitterId,
      status: "Submitted",
      notes: undefined,
      createdAt: 1773868800000,
      updatedAt: 1774041600000,
    });

    const expense2Id = await ctx.db.insert("expenses", {
      title: "Hotel - Partner Meeting (2 nights)",
      description: "Hampton Inn Austin Downtown, March 17-19",
      amount: 312.48,
      date: 1773955200000,
      categoryId: categoryTravelId,
      receiptUrl: undefined,
      merchant: "Hampton Inn",
      paymentMethod: "CreditCard",
      reportId: report1Id,
      submittedById: submitterId,
      status: "Submitted",
      notes: "Government rate applied",
      createdAt: 1773955200000,
      updatedAt: 1774041600000,
    });

    const expense3Id = await ctx.db.insert("expenses", {
      title: "Workshop Supplies - Youth Program",
      description: "Art supplies, notebooks, and markers for spring workshop series",
      amount: 156.73,
      date: 1774214400000,
      categoryId: categoryProgramId,
      receiptUrl: undefined,
      merchant: "Michaels",
      paymentMethod: "DebitCard",
      reportId: undefined,
      submittedById: approverId,
      status: "Draft",
      notes: undefined,
      createdAt: 1774214400000,
      updatedAt: 1774214400000,
    });

    const expense4Id = await ctx.db.insert("expenses", {
      title: "Nonprofit Leadership Summit Registration",
      description: "Annual NLS conference registration - early bird rate",
      amount: 575.0,
      date: 1774300800000,
      categoryId: categoryTrainingId,
      receiptUrl: undefined,
      merchant: "National Council of Nonprofits",
      paymentMethod: "CreditCard",
      reportId: report2Id,
      submittedById: approverId,
      status: "Draft",
      notes: "Early bird discount saves $150",
      createdAt: 1774300800000,
      updatedAt: 1774300800000,
    });

    const expense5Id = await ctx.db.insert("expenses", {
      title: "Printer Toner Cartridges",
      description: "3x HP 26A toner cartridges for office printer",
      amount: 189.47,
      date: 1774128000000,
      categoryId: categoryOfficeId,
      receiptUrl: undefined,
      merchant: "Staples",
      paymentMethod: "CreditCard",
      reportId: undefined,
      submittedById: adminId,
      status: "Approved",
      notes: undefined,
      createdAt: 1774128000000,
      updatedAt: 1774300800000,
    });

    // ── Approvals ──
    await ctx.db.insert("approvals", {
      reportId: report1Id,
      approverId: adminId,
      action: "ReturnedForRevision",
      comments: "Please attach receipt for the hotel stay before resubmitting.",
      actionAt: 1774128000000,
      createdAt: 1774128000000,
    });

    await ctx.db.insert("approvals", {
      reportId: report1Id,
      approverId: approverId,
      action: "Approved",
      comments: "All receipts verified. Amounts are within travel policy limits.",
      actionAt: 1774473600000,
      createdAt: 1774473600000,
    });

    // ── Receipts ──
    await ctx.db.insert("receipts", {
      expenseId: expense1Id,
      fileUrl: "https://storage.example.com/receipts/southwest-booking-conf.pdf",
      fileName: "southwest-booking-confirmation.pdf",
      fileSize: 245760,
      fileType: "application/pdf",
      uploadedAt: 1773868800000,
      createdAt: 1773868800000,
    });

    await ctx.db.insert("receipts", {
      expenseId: expense2Id,
      fileUrl: "https://storage.example.com/receipts/hampton-inn-folio.pdf",
      fileName: "hampton-inn-folio-march2026.pdf",
      fileSize: 189440,
      fileType: "application/pdf",
      uploadedAt: 1774041600000,
      createdAt: 1774041600000,
    });

    await ctx.db.insert("receipts", {
      expenseId: expense5Id,
      fileUrl: "https://storage.example.com/receipts/staples-toner.jpg",
      fileName: "staples-receipt-toner.jpg",
      fileSize: 1048576,
      fileType: "image/jpeg",
      uploadedAt: 1774128000000,
      createdAt: 1774128000000,
    });

    // ── Notifications ──
    await ctx.db.insert("notifications", {
      userId: approverId,
      type: "ReportSubmitted",
      title: "New Report for Review",
      message: "Emily Rivera submitted 'March 2026 Austin Partner Visit' ($799.80) for your review.",
      link: "/reports",
      isRead: false,
      readAt: undefined,
      createdAt: 1774041600000,
    });

    await ctx.db.insert("notifications", {
      userId: submitterId,
      type: "ReportApproved",
      title: "Report Approved",
      message: "Your report 'March 2026 Austin Partner Visit' has been approved by Marcus Johnson.",
      link: "/reports",
      isRead: true,
      readAt: 1774560000000,
      createdAt: 1774473600000,
    });

    await ctx.db.insert("notifications", {
      userId: adminId,
      type: "BudgetWarning",
      title: "Budget Alert: Travel 78% Used",
      message: "The Programs department Travel budget (FY2026) has reached 78% utilization. $11,752.15 remaining of $15,000.00.",
      link: "/budgets",
      isRead: false,
      readAt: undefined,
      createdAt: 1774387200000,
    });

    await ctx.db.insert("notifications", {
      userId: submitterId,
      type: "SystemAlert",
      title: "Expense Policy Updated",
      message: "The per diem meal rate has been updated to $65/day effective April 1, 2026. Please review the updated travel policy.",
      link: undefined,
      isRead: false,
      readAt: undefined,
      createdAt: 1774300800000,
    });

    // ── Audit Logs ──
    await ctx.db.insert("auditLogs", {
      userId: submitterId,
      action: "Create",
      entityType: "ExpenseReport",
      entityId: report1Id,
      details: "{\"title\":\"March 2026 Austin Partner Visit\",\"totalAmount\":799.80}",
      ipAddress: "192.168.1.45",
      createdAt: 1773868800000,
    });

    await ctx.db.insert("auditLogs", {
      userId: submitterId,
      action: "StatusChange",
      entityType: "ExpenseReport",
      entityId: report1Id,
      details: "{\"from\":\"Draft\",\"to\":\"Submitted\"}",
      ipAddress: "192.168.1.45",
      createdAt: 1774041600000,
    });

    await ctx.db.insert("auditLogs", {
      userId: approverId,
      action: "Approve",
      entityType: "ExpenseReport",
      entityId: report1Id,
      details: "{\"action\":\"Approved\",\"comments\":\"All receipts verified. Amounts are within travel policy limits.\"}",
      ipAddress: "10.0.0.22",
      createdAt: 1774473600000,
    });

    console.log("Database seeded successfully with 3 users, 5 categories, 5 budget lines, 2 reports, 5 expenses, 2 approvals, 3 receipts, 4 notifications, and 3 audit logs.");
  },
});
