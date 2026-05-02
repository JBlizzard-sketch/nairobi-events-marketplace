import { getAuth } from "@clerk/express";
import { Router, type IRouter } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { BudgetOptimizeBody } from "@workspace/api-zod";

const router: IRouter = Router();

const SERVICE_LABELS: Record<string, string> = {
  catering: "Catering",
  mc: "MC / Emcee",
  photography: "Photography",
  videography: "Videography",
  floristry: "Floristry",
  av_technical: "AV & Technical",
  tent_furniture: "Tent & Furniture",
  security: "Security",
  entertainment: "Entertainment",
  decor: "Decor",
  transportation: "Transportation",
};

// POST /ai/budget-optimize
router.post("/ai/budget-optimize", async (req, res): Promise<void> => {
  const clerkId = getAuth(req)?.userId ?? undefined;
  if (!clerkId) {
    res.status(401).json({ error: "unauthorized", message: "Authentication required" });
    return;
  }

  const parsed = BudgetOptimizeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "bad_request", message: parsed.error.message });
    return;
  }

  const { eventType, guestCount, totalBudget, servicesNeeded, city } = parsed.data;

  const serviceList = servicesNeeded.map(s => SERVICE_LABELS[s] ?? s).join(", ");
  const budgetContext = totalBudget
    ? `The planner has indicated a total budget of KES ${Number(totalBudget).toLocaleString()}.`
    : "The planner has not yet specified a budget — suggest an appropriate total.";

  const systemPrompt = `You are an expert Nairobi event budget advisor with deep knowledge of vendor pricing in the Kenyan market. 
You help event planners allocate budgets across service categories realistically based on current Nairobi market rates (2024-2025).
Always return valid JSON only — no markdown, no explanation outside the JSON.`;

  const userPrompt = `An event planner is organising a ${eventType.replace(/_/g, " ")} event in ${city ?? "Nairobi"} for ${guestCount} guests.
They need the following services: ${serviceList}.
${budgetContext}

Provide a realistic budget optimisation in JSON with this exact structure:
{
  "suggestedMin": "<number as string, KES>",
  "suggestedMax": "<number as string, KES>",
  "currency": "KES",
  "breakdown": [
    {
      "service": "<service id, one of: ${servicesNeeded.join(", ")}>",
      "label": "<human readable name>",
      "amount": "<recommended mid-range KES amount as string>",
      "percentage": <integer 0-100>,
      "rationale": "<1 sentence explaining the allocation based on Nairobi market rates>"
    }
  ],
  "tips": ["<practical cost-saving tip for this event type>", "<another tip>", "<another tip>"]
}

Ensure percentages sum to 100. Base amounts on real Nairobi vendor pricing. For the tips, be specific and actionable for this event type and guest count.`;

  const response = await openai.chat.completions.create({
    model: "gpt-5-mini",
    max_completion_tokens: 2048,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content ?? "{}";

  let result: unknown;
  try {
    result = JSON.parse(content);
  } catch {
    res.status(500).json({ error: "ai_error", message: "Failed to parse AI response" });
    return;
  }

  res.json(result);
});

export default router;
