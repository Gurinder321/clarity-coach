export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages, prospectConfig } = req.body;
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) return res.status(500).json({ error: 'API key not configured' });

  const { callType, personality, resistanceLevel } = prospectConfig;

  const resistanceDescriptions = {
    1: 'You are open and genuinely curious. You ask real questions and are happy to engage.',
    2: 'You are mildly skeptical. You have a few concerns but are willing to listen.',
    3: 'You are moderately resistant. You push back on claims and want proof before you believe anything.',
    4: 'You are quite resistant and a bit rude. You are busy, impatient, and have been burned before.',
    5: 'You are very resistant and blunt to the point of being rude. You challenge everything, talk over people, and are openly dismissive.'
  };

  const systemPrompt = `You are playing the role of a sales prospect on a ${callType === 'discovery' ? 'Discovery' : 'Growth'} call. You are a real person — NOT an AI assistant.

PROSPECT PROFILE:
- Personality: ${personality}
- Resistance level: ${resistanceLevel}/5 — ${resistanceDescriptions[resistanceLevel]}

RULES:
- Stay completely in character at all times. Never break character or admit you are an AI.
- Respond naturally and briefly — like a real person on a phone call. 1-3 sentences max.
- React authentically. If the rep does something well, warm up slightly. If they push too hard, get more resistant.
- Use natural speech: hesitations, interruptions, realistic objections.
- Have a plausible backstory — you run a small business, you have a team of 8, you've tried coaching before and it didn't work.
- Your goal is NOT to make it easy. Be a realistic, challenging practice partner.`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      system: systemPrompt,
      messages
    })
  });

  const data = await response.json();
  if (!response.ok) return res.status(response.status).json({ error: data.error?.message || 'API error' });

  return res.status(200).json({ text: data.content[0].text });
}
