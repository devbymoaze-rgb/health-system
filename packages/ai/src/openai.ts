import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { parsePKT, TIMEZONE } from '@crm-eye/shared';
import { executeTool } from './executor';
import { clearSession, getSessionConversation, updateSessionContext } from './session';
import { TOOLS } from './tools';

type Logger = {
  info: (msg: string) => void;
  error: (msg: string) => void;
  warn: (msg: string) => void;
};

async function callOpenAI(
  openai: OpenAI,
  messages: Array<Record<string, unknown>>,
  useTools: boolean,
  logger: Logger,
  retryCount = 0
) {
  const payload: Record<string, unknown> = {
    model: 'gpt-4o-mini',
    messages,
    temperature: 0.3,
  };
  if (useTools) {
    payload.tools = TOOLS;
    payload.tool_choice = 'auto';
  }

  logger.info(`📤 OpenAI call | msgs: ${messages.length} | tools: ${!!useTools} | retry: ${retryCount}`);

  try {
    const response = await openai.chat.completions.create(payload as never);
    logger.info(`📥 OpenAI response | finish: ${response.choices[0].finish_reason}`);
    return response;
  } catch (err) {
    if (retryCount < 2) {
      logger.warn(`OpenAI call failed, retrying... (${retryCount + 1}/2)`);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return callOpenAI(openai, messages, useTools, logger, retryCount + 1);
    }
    throw err;
  }
}

export async function getOpenAIResponse(
  systemPrompt: string,
  userMessage: string,
  apiKey: string,
  remoteJid: string,
  logger: Logger
) {
  const openai = new OpenAI({ apiKey });
  const session = getSessionConversation(remoteJid);

  session.messages.push({ role: 'user', content: String(userMessage) });

  if (session.messages.length > 20) {
    session.messages = session.messages.slice(-20);
  }

  let contextPrompt = '';
  if (Object.keys(session.contextData).length > 0) {
    contextPrompt = '\n\n## Information already collected in this conversation:\n';
    if (session.contextData.name) contextPrompt += `- Name: ${session.contextData.name}\n`;
    if (session.contextData.email) contextPrompt += `- Email: ${session.contextData.email}\n`;
    if (session.contextData.date) contextPrompt += `- Preferred Date: ${session.contextData.date}\n`;
    if (session.contextData.time) contextPrompt += `- Preferred Time: ${session.contextData.time}\n`;
    contextPrompt += '\nUse this information instead of asking again.';
  }

  const fullSystemPrompt = systemPrompt + contextPrompt;
  const conversationHistory = [{ role: 'system', content: fullSystemPrompt }, ...session.messages];

  let turn1;
  try {
    turn1 = await callOpenAI(openai, conversationHistory, true, logger);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error(`Turn1 error: ${message}`);
    const msg = message.toLowerCase();
    if (msg.includes('api key') || msg.includes('authentication')) {
      return '⚠️ System Error: Invalid OpenAI API key. Please check your settings.';
    }
    if (msg.includes('quota') || msg.includes('billing')) {
      return '⚠️ System Error: OpenAI account out of credits. Please check billing.';
    }

    session.retryCount = (session.retryCount || 0) + 1;
    if (session.retryCount <= 2) {
      return "I'm processing your request. Please give me a moment...";
    }
    session.retryCount = 0;
    return 'I apologize for the delay. Could you please rephrase your request?';
  }

  session.retryCount = 0;
  const assistantMsg = turn1.choices[0].message;

  const savedAssistant: Record<string, unknown> = {
    role: 'assistant',
    content: assistantMsg.content || '',
  };
  if (assistantMsg.tool_calls?.length) {
    savedAssistant.tool_calls = assistantMsg.tool_calls.map((tc) => {
      const fn = 'function' in tc ? tc.function : { name: '', arguments: '{}' };
      return {
        id: tc.id,
        type: 'function',
        function: { name: fn.name, arguments: fn.arguments },
      };
    });
  }
  session.messages.push(savedAssistant);

  if (assistantMsg.tool_calls?.length) {
    let bookingDone = false;
    let bookingTime = '';
    const extractedInfo: Record<string, string> = {};
    let isCancellation = false;
    let isLookupOnly = false;

    for (const tc of assistantMsg.tool_calls) {
      let args: Record<string, string> = {};
      const fn = 'function' in tc ? tc.function : { name: '', arguments: '{}' };
      try {
        args = JSON.parse(fn.arguments || '{}');
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        logger.error(`Bad tool args JSON: ${msg}`);
      }

      const result = await executeTool(fn.name, args, remoteJid, logger);

      if (fn.name === 'createAppointment' && (result as { success?: boolean })?.success) {
        bookingDone = true;
        bookingTime = (result as { confirmedTime?: string }).confirmedTime || '';
        if (args.patientName) extractedInfo.name = args.patientName;
        if (args.patientEmail) extractedInfo.email = args.patientEmail;
      }

      if (fn.name === 'cancelAppointment' && (result as { success?: boolean })?.success) {
        isCancellation = true;
      }

      if (fn.name === 'lookupAppointmentByEmail' && (result as { found?: boolean })?.found) {
        isLookupOnly = true;
      }

      if (args.startTime) {
        const parsedDate = parsePKT(args.startTime);
        if (!isNaN(parsedDate.getTime())) {
          extractedInfo.date = parsedDate.toLocaleDateString('en-US', {
            timeZone: TIMEZONE,
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          });
          extractedInfo.time = parsedDate.toLocaleTimeString('en-US', {
            timeZone: TIMEZONE,
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          });
        }
      }

      if (args.patientName) extractedInfo.name = args.patientName;
      if (args.patientEmail) extractedInfo.email = args.patientEmail;
      if (args.newStartTime) {
        const parsedDate = parsePKT(args.newStartTime);
        if (!isNaN(parsedDate.getTime())) {
          extractedInfo.date = parsedDate.toLocaleDateString('en-US', {
            timeZone: TIMEZONE,
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          });
          extractedInfo.time = parsedDate.toLocaleTimeString('en-US', {
            timeZone: TIMEZONE,
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          });
        }
      }

      session.messages.push({
        role: 'tool',
        tool_call_id: tc.id,
        content: JSON.stringify(result),
      });
    }

    if (Object.keys(extractedInfo).length > 0 && !isLookupOnly) {
      updateSessionContext(remoteJid, extractedInfo);
    }

    const messagesWithToolResults = [{ role: 'system', content: fullSystemPrompt }, ...session.messages];

    let turn2;
    try {
      turn2 = await callOpenAI(openai, messagesWithToolResults, false, logger);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error(`Turn2 error: ${message}`);
      if (bookingDone) {
        const successMsg = `✅ Your appointment has been successfully booked!\n📅 *${bookingTime}*\n\nWe look forward to welcoming you. You'll receive a reminder before your appointment.\n\nIs there anything else I can help you with?`;
        session.messages.push({ role: 'assistant', content: successMsg });
        clearSession(remoteJid, logger);
        return successMsg;
      }
      if (isCancellation) {
        return '✅ Your appointment has been cancelled and removed from our system successfully.\n\nIs there anything else I can help you with?';
      }
      return "I've processed your request. Could you please confirm what you'd like to do next?";
    }

    const finalMsg = turn2.choices[0].message;
    const finalText =
      finalMsg.content ||
      (bookingDone
        ? `✅ Your appointment has been booked for *${bookingTime}*.`
        : 'Done! Is there anything else I can help you with?');

    session.messages.push({ role: 'assistant', content: finalText });

    if (bookingDone || isCancellation) {
      clearSession(remoteJid, logger);
    }

    return finalText;
  }

  session.messages.push({
    role: 'assistant',
    content: assistantMsg.content || "I'm here to help. Please go ahead!",
  });
  return assistantMsg.content || "I'm here to help. Please go ahead!";
}

export async function getHealthChatResponse(
  messages: Array<{ role: string; content: string }>,
  apiKey: string
) {
  const openai = new OpenAI({ apiKey });
  const { HEALTH_CHAT_SYSTEM_PROMPT } = await import('./prompt');

  const chatMessages: ChatCompletionMessageParam[] = [
    { role: 'system', content: HEALTH_CHAT_SYSTEM_PROMPT },
    ...(messages as ChatCompletionMessageParam[]),
  ];

  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: chatMessages,
  });

  return response.choices[0].message;
}
