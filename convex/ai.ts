import { v } from "convex/values";
import { action } from "./_generated/server";

async function callOpenRouter(prompt: string, systemPrompt?: string): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY environment variable is not configured.");

  const messages: Array<{ role: string; content: string }> = [];
  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt });
  }
  messages.push({ role: "user", content: prompt });

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "nvidia/nemotron-3-super-120b-a12b:free",
      messages,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("No response content from OpenRouter API.");
  return content;
}

export const parseReceipt = action({
  args: { description: v.string() },
  handler: async (_ctx, args) => {
    const systemPrompt = `You are an expense receipt parser. Given a plain text description of a purchase, extract structured data and return ONLY valid JSON with these fields:
- amount: number (the dollar amount, e.g. 42.50)
- vendor: string (the merchant/vendor name)
- date: string (ISO date format YYYY-MM-DD, or null if not mentioned)
- category: string (one of: Travel, Meals, Supplies, Equipment, Software, Training, Marketing, Other)
- purpose: string (brief business purpose)
- receiptNeeded: boolean (true if amount > 25 or if the description suggests a significant purchase)

If a field cannot be determined, use null. Always return valid JSON.`;

    const result = await callOpenRouter(args.description, systemPrompt);
    try {
      const parsed = JSON.parse(result);
      return parsed;
    } catch {
      // Try to extract JSON from the response
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error("Failed to parse AI response as JSON.");
    }
  },
});

export const generateReportNarrative = action({
  args: {
    reportTitle: v.string(),
    reportPeriod: v.optional(v.string()),
    totalAmount: v.float64(),
    expenses: v.array(v.object({
      title: v.string(),
      amount: v.float64(),
      merchant: v.string(),
      categoryName: v.string(),
      date: v.float64(),
    })),
  },
  handler: async (_ctx, args) => {
    const systemPrompt = `You are a financial report writer for a nonprofit organization. Generate a professional narrative summary of an expense report suitable for a finance committee review. The summary should:
- Open with the report title and period
- Summarize total spending and number of expenses
- Group and describe expenses by category
- Note any significant individual expenses
- Use professional, concise language appropriate for board/committee review
- Keep the narrative to 2-3 paragraphs`;

    const expenseList = args.expenses.map((e) =>
      `- ${e.title}: $${e.amount.toFixed(2)} at ${e.merchant} (${e.categoryName}) on ${new Date(e.date).toLocaleDateString()}`
    ).join("\n");

    const prompt = `Generate a narrative summary for this expense report:

Report: ${args.reportTitle}
Period: ${args.reportPeriod ?? "Not specified"}
Total: $${args.totalAmount.toFixed(2)}
Number of expenses: ${args.expenses.length}

Expenses:
${expenseList}`;

    return await callOpenRouter(prompt, systemPrompt);
  },
});

export const checkPolicyCompliance = action({
  args: {
    title: v.string(),
    amount: v.float64(),
    categoryName: v.string(),
    merchant: v.string(),
    description: v.optional(v.string()),
    hasReceipt: v.boolean(),
  },
  handler: async (_ctx, args) => {
    const systemPrompt = `You are a nonprofit expense policy compliance checker. Evaluate the expense against these organization policies:

POLICIES:
1. Per-diem meal limit: $75/day
2. Travel expenses over $500 require pre-approval
3. Software/equipment purchases over $250 require pre-approval
4. Receipts are REQUIRED for any expense over $25
5. Entertainment expenses require documented business purpose
6. Conference/training registration over $1000 requires director approval
7. All expenses must have a clear business purpose
8. Reimbursement requests must be submitted within 60 days of the expense

Return ONLY valid JSON with this structure:
{
  "status": "pass" | "warning" | "fail",
  "checks": [
    {
      "policy": "policy name",
      "result": "pass" | "warning" | "fail",
      "message": "explanation"
    }
  ],
  "summary": "brief overall assessment"
}`;

    const prompt = `Check this expense for policy compliance:
Title: ${args.title}
Amount: $${args.amount.toFixed(2)}
Category: ${args.categoryName}
Merchant: ${args.merchant}
Description: ${args.description ?? "None provided"}
Has Receipt: ${args.hasReceipt ? "Yes" : "No"}`;

    const result = await callOpenRouter(prompt, systemPrompt);
    try {
      return JSON.parse(result);
    } catch {
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error("Failed to parse compliance check response.");
    }
  },
});

export const explainBudgetVariance = action({
  args: {
    budgetLineName: v.string(),
    categoryName: v.string(),
    department: v.string(),
    fiscalYear: v.string(),
    budgetedAmount: v.float64(),
    spentAmount: v.float64(),
    remainingAmount: v.float64(),
    expenses: v.array(v.object({
      title: v.string(),
      amount: v.float64(),
      merchant: v.string(),
      date: v.float64(),
      status: v.string(),
    })),
  },
  handler: async (_ctx, args) => {
    const systemPrompt = `You are a budget analyst for a nonprofit organization. Analyze the budget variance and provide a clear explanation. Your analysis should:
- State whether spending is over or under budget and by how much
- Identify the top expense drivers by amount
- Note any patterns (e.g., spending concentrated in certain months or with certain vendors)
- Provide a brief outlook/recommendation
- Keep the explanation to 2-3 concise paragraphs`;

    const utilization = args.budgetedAmount > 0
      ? ((args.spentAmount / args.budgetedAmount) * 100).toFixed(1)
      : "0";

    const expenseList = args.expenses.map((e) =>
      `- ${e.title}: $${e.amount.toFixed(2)} at ${e.merchant} on ${new Date(e.date).toLocaleDateString()} (${e.status})`
    ).join("\n");

    const prompt = `Analyze the budget variance for this budget line:

Budget Line: ${args.budgetLineName}
Category: ${args.categoryName}
Department: ${args.department}
Fiscal Year: ${args.fiscalYear}
Budgeted: $${args.budgetedAmount.toFixed(2)}
Spent: $${args.spentAmount.toFixed(2)}
Remaining: $${args.remainingAmount.toFixed(2)}
Utilization: ${utilization}%

Expenses charged to this budget:
${expenseList || "No expenses yet."}`;

    return await callOpenRouter(prompt, systemPrompt);
  },
});
