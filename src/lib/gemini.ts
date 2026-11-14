export interface GenerateContentParams {
  topic: string;
  platform?: string;
  contentType?: string;
  objective?: string;
  tone?: 'Egyptian Farmer (عامية زراعية)' | 'Professional AgriTech (رسمي متخصص)' | 'Persuasive Marketing (تسويقي تفاعلي)' | 'Educational (إرشادي زراعي)';
  targetAudience?: string;
  additionalNotes?: string;
  lang?: 'ar' | 'en';
}

export interface GeneratedPost {
  title: string;
  caption: string;
  description: string;
  hashtags: string[];
  cta: string;
}

export interface WeatherPostParams {
  governorate: string;
  condition: string;
  temp: number;
  advice: string;
  lang?: 'ar' | 'en';
}

export interface CompetitorAnalysisParams {
  competitorName: string;
  platform: string;
  observation: string;
  lang?: 'ar' | 'en';
}

/**
 * Call server-side Gemini API proxy, or pass client apiKey if stored in localStorage
 */
export async function callGemini(prompt: string, systemInstruction?: string): Promise<string> {
  let customApiKey = '';
  try {
    customApiKey = localStorage.getItem('cropsa_gemini_api_key') || '';
  } catch (_) {}

  const response = await fetch('/api/gemini', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      systemInstruction,
      apiKey: customApiKey || undefined,
      model: 'gemini-2.0-flash',
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to call Gemini AI service.');
  }

  return data.text || '';
}

/**
 * Generate full marketing post content tailored for Egyptian AgriTech
 */
export async function generateMarketingContent(params: GenerateContentParams): Promise<GeneratedPost> {
  const {
    topic,
    platform = 'Facebook',
    contentType = 'Post',
    objective = 'Trust',
    tone = 'Egyptian Farmer (عامية زراعية)',
    targetAudience = 'مزارعي الدلتا والصعيد وأصحاب المزارع',
    additionalNotes = '',
    lang = 'ar',
  } = params;

  const systemInstruction = `
You are the Chief AgriTech Copywriter & Social Media Strategist for "Cropsa" (كروبسا), Egypt's leading agricultural technology platform.
Cropsa provides digital crop monitoring, disease diagnostics, weather advisory, and yield maximization tools for Egyptian farmers, agronomists, and agricultural companies.
Your copy must sound authentic, culturally resonant, farmer-friendly, credible, and persuasive.
Never output generic corporate fluff. Use Egyptian farming terminologies (مثل: الفدان، التسميد، الري، المحصول، التقليم، المكافحة، العفن، التوريد).
You must output STRICT JSON format with no markdown fences, matching this structure:
{
  "title": "Short catchy internal title",
  "caption": "Short hook or opening one-liner with emojis",
  "description": "Full engaging post body with clear problem, solution via Cropsa, and practical tips",
  "hashtags": ["#كروبسا", "#زراعة", ...],
  "cta": "Call to action sentence"
}
`;

  const prompt = `
Generate a ${platform} ${contentType} for Cropsa AgriTech.
- Topic: ${topic}
- Objective: ${objective}
- Target Audience: ${targetAudience}
- Tone of Voice: ${tone}
- Additional Details / Special Requirements: ${additionalNotes || 'Focus on value for farmers and saving harvest loss.'}
- Preferred Language: ${lang === 'ar' ? 'Arabic (Egyptian dialect or accessible Arabic appropriate for Egyptian agriculture)' : 'English'}

Output purely JSON without backticks:
`;

  const rawText = await callGemini(prompt, systemInstruction);

  try {
    // Clean markdown code blocks if model returned them
    const cleaned = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    return {
      title: parsed.title || topic,
      caption: parsed.caption || '',
      description: parsed.description || '',
      hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags : ['#كروبسا', '#زراعة_مصر'],
      cta: parsed.cta || '',
    };
  } catch (e) {
    // Fallback if parsing fails
    return {
      title: topic,
      caption: rawText.slice(0, 150),
      description: rawText,
      hashtags: ['#كروبسا', '#زراعة_مصر', '#محصولك_مع_كروبسا'],
      cta: 'حمل تطبيق كروبسا دلوقتي واحمِ أرضك ومحصولك!',
    };
  }
}

/**
 * Generate quick advisory content from weather warnings
 */
export async function generateWeatherAlertPost(params: WeatherPostParams): Promise<GeneratedPost> {
  const { governorate, condition, temp, advice, lang = 'ar' } = params;

  const systemInstruction = `
You are an Egyptian agricultural expert at Cropsa AgriTech.
You write urgent, caring, and practical weather warning posts for farmers in specific Egyptian governorates.
Return strictly valid JSON:
{
  "title": "Short title",
  "caption": "Short alarming hook",
  "description": "Full advisory with dos and don'ts for crops",
  "hashtags": ["#تحذير_جوي", "#كروبسا", ...],
  "cta": "Call to action"
}
`;

  const prompt = `
Generate an urgent social media advisory post for farmers in ${governorate}, Egypt.
Current / Upcoming Weather Condition: ${condition}
Temperature: ${temp}°C
Agricultural Specialist Advice: ${advice}
Target: Farmers and orchard managers in ${governorate}.
Language: ${lang === 'ar' ? 'Egyptian Arabic' : 'English'}

Output purely JSON without backticks:
`;

  const rawText = await callGemini(prompt, systemInstruction);

  try {
    const cleaned = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    return {
      title: parsed.title || `تنبيه طقس مزارعي ${governorate}`,
      caption: parsed.caption || '',
      description: parsed.description || '',
      hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags : ['#تنبيه_طقس', '#كروبسا', `#زراعة_${governorate}`],
      cta: parsed.cta || 'افتح تطبيق كروبسا لمتابعة حالة قطعتك دقيقة بدقيقة.',
    };
  } catch (e) {
    return {
      title: `تنبيه جوي لمزارعي ${governorate}`,
      caption: `⚠️ تنبيه هام لمزارعينا في ${governorate}: ${condition} بدرجة حرارة ${temp}°C`,
      description: `${advice}\n\nتابعوا توصيات مهندسي كروبسا لتجنب أي خسائر في المحصول.`,
      hashtags: ['#تحذير_جوي', '#كروبسا', '#زراعة_مصر'],
      cta: 'تواصل مع فريق الدعم الفني في كروبسا للمساعدة المباشرة.',
    };
  }
}

/**
 * Generate counter-strategy and response ideas against competitor moves
 */
export async function generateCompetitorCounterStrategy(params: CompetitorAnalysisParams): Promise<{
  analysis: string;
  counterTactics: string[];
  suggestedCampaign: string;
}> {
  const { competitorName, platform, observation, lang = 'ar' } = params;

  const systemInstruction = `
You are Cropsa's Chief Marketing Officer (CMO).
Provide sharp, strategic, actionable marketing countermeasures for our AgriTech platform.
Return strictly valid JSON:
{
  "analysis": "Brief breakdown of competitor strength/weakness in this move",
  "counterTactics": ["Tactic 1", "Tactic 2", "Tactic 3"],
  "suggestedCampaign": "Name and brief outline of campaign we should launch to outperform them"
}
`;

  const prompt = `
Competitor: ${competitorName}
Observed on: ${platform}
Observation / Campaign: ${observation}
Language: ${lang === 'ar' ? 'Arabic' : 'English'}

Provide smart counter-strategy purely as JSON without backticks:
`;

  const rawText = await callGemini(prompt, systemInstruction);

  try {
    const cleaned = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    return {
      analysis: parsed.analysis || '',
      counterTactics: Array.isArray(parsed.counterTactics) ? parsed.counterTactics : [],
      suggestedCampaign: parsed.suggestedCampaign || '',
    };
  } catch (e) {
    return {
      analysis: rawText,
      counterTactics: ['تكثيف المحتوى التوعوي الميداني', 'إبراز سرعة استجابة تطبيق كروبسا'],
      suggestedCampaign: 'حملة إثبات الفارق بالنتائج الحقيقية من الميدان',
    };
  }
}

/**
 * Enhance or rewrite existing post text
 */
export async function improvePostContent(currentText: string, instruction: string, lang: 'ar' | 'en' = 'ar'): Promise<string> {
  const prompt = `
You are Cropsa's AgriTech copy editor.
Current Text:
"""${currentText}"""

Instruction:
${instruction}

Rewrite and polish the text in ${lang === 'ar' ? 'Arabic (lively, compelling, farmer-friendly Egyptian style)' : 'English'}.
Return ONLY the polished revised text without meta comments.
`;

  return await callGemini(prompt);
}
