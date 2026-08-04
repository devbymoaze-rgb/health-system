import { getHealthChatResponse } from '@crm-eye/ai';

export async function POST(req: Request) {
  const { messages } = await req.json();

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return new Response('OpenAI API key not configured', { status: 500 });
    }

    const message = await getHealthChatResponse(messages, apiKey);
    return new Response(JSON.stringify(message));
  } catch (error) {
    console.error(error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
