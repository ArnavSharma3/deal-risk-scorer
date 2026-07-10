import Anthropic from "@anthropic-ai/sdk";
import type { RiskFactors } from "@/lib/types";

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

interface ExplanationInput {
  dealName: string;
  amount: number;
  stage: string;
  closeDate: string;
  score: number;
  factors: RiskFactors;
  ownerName: string;
  daysSinceActivity: number;
  stakeholderCount: number;
}

export async function generateExplanationAndRecommendations(
  input: ExplanationInput
): Promise<{ explanation: string; recommendations: string[] }> {
  if (!anthropic) {
    return generateFallback(input);
  }

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `You are a sales pipeline risk analyst. Analyze this deal and provide a plain-English risk explanation and 3 specific recommended next actions.

Deal: ${input.dealName}
Value: $${input.amount.toLocaleString()}
Stage: ${input.stage}
Close Date: ${input.closeDate}
Owner: ${input.ownerName}
Risk Score: ${input.score}/100 (higher = more at risk)

Risk Factor Breakdown:
- Days since last activity: ${input.daysSinceActivity} (activity risk component: ${input.factors.activityScore}/100)
- Stage velocity risk: ${input.factors.stageVelocityScore}/100
- Stakeholder engagement risk: ${input.factors.stakeholderScore}/100 (${input.stakeholderCount} stakeholders)
- Email/meeting recency risk: ${input.factors.engagementRecencyScore}/100

Respond in JSON format only:
{
  "explanation": "2-3 sentence plain-English explanation of why this deal is at risk",
  "recommendations": ["specific action 1", "specific action 2", "specific action 3"]
}`,
        },
      ],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as {
        explanation: string;
        recommendations: string[];
      };
      return {
        explanation: parsed.explanation,
        recommendations: parsed.recommendations.slice(0, 3),
      };
    }
  } catch (error) {
    console.error("Claude API error:", error);
  }

  return generateFallback(input);
}

function generateFallback(input: ExplanationInput): {
  explanation: string;
  recommendations: string[];
} {
  const drivers: string[] = [];

  if (input.factors.activityScore >= 60) {
    drivers.push(
      `no meaningful activity in ${input.daysSinceActivity} days`
    );
  }
  if (input.factors.stageVelocityScore >= 60) {
    drivers.push(`the deal has been stalled in ${input.stage} longer than team norms`);
  }
  if (input.factors.stakeholderScore >= 60) {
    drivers.push(
      `limited stakeholder engagement (${input.stakeholderCount} contacts tracked)`
    );
  }
  if (input.factors.engagementRecencyScore >= 60) {
    drivers.push("recent email and meeting engagement has dropped off");
  }

  const explanation =
    drivers.length > 0
      ? `This $${(input.amount / 1000).toFixed(0)}K deal "${input.dealName}" is flagged at risk (score: ${input.score}/100) primarily because ${drivers.join(", ")}. With a close date of ${input.closeDate}, immediate attention is needed to prevent slippage.`
      : `This deal "${input.dealName}" shows moderate risk signals (score: ${input.score}/100). While some metrics are healthy, proactive engagement before the ${input.closeDate} close date will help secure the win.`;

  const recommendations: string[] = [];

  if (input.factors.activityScore >= 50) {
    recommendations.push(
      `Schedule a check-in call with the champion within 48 hours — last activity was ${input.daysSinceActivity} days ago`
    );
  }
  if (input.factors.stakeholderScore >= 50) {
    recommendations.push(
      "Map and engage at least 2 additional decision-makers or influencers on the buying committee"
    );
  }
  if (input.factors.stageVelocityScore >= 50) {
    recommendations.push(
      `Define clear exit criteria for ${input.stage} and set a mutual action plan with the buyer`
    );
  }
  if (input.factors.engagementRecencyScore >= 50) {
    recommendations.push(
      "Send a value-add email with a relevant case study and propose a 30-minute working session"
    );
  }

  while (recommendations.length < 3) {
    recommendations.push(
      "Review the deal strategy with your manager and update the forecast category if needed"
    );
  }

  return { explanation, recommendations: recommendations.slice(0, 3) };
}
