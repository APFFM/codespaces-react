// AI Service for communicating with OpenAI and DeepSeek APIs

export const sendMessageToOpenAI = async (messages, apiKey) => {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to get response from OpenAI');
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI API Error:', error);
    throw error;
  }
};

export const sendMessageToDeepSeek = async (messages, apiKey) => {
  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to get response from DeepSeek');
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('DeepSeek API Error:', error);
    throw error;
  }
};

export const generateFollowUpQuestions = async (messageContent, apiKey) => {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant generating follow-up questions. Based on the given AI response, generate 3 thoughtful, concise follow-up questions that would help the user explore the topic further or gain more insights. Format your response as a JSON array of strings. Only return the JSON array, no other text.'
          },
          {
            role: 'user',
            content: `Generate follow-up questions for this AI response: "${messageContent}"`
          }
        ],
        temperature: 0.7,
        max_tokens: 200
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Error generating follow-up questions');
    }

    const data = await response.json();
    const content = data.choices[0].message.content.trim();
    
    // Try to parse as JSON
    try {
      // Handle cases where the AI might include extra text around the JSON
      const jsonMatch = content.match(/\[.*\]/s);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // Direct parse if it's a clean JSON response
      return JSON.parse(content);
    } catch (e) {
      console.error('Failed to parse follow-up questions as JSON:', e);
      
      // Try to extract questions with regex as fallback
      const questions = content.match(/"([^"]+)"/g)?.map(q => q.replace(/"/g, '')) || [];
      
      if (questions.length > 0) {
        return questions.slice(0, 3);
      }
      
      // Default questions if all else fails
      return [
        'Can you elaborate more on this topic?',
        'What are some practical applications of this?',
        'How does this relate to other areas?'
      ];
    }
  } catch (error) {
    console.error('Error generating follow-up questions:', error);
    return [
      'Can you elaborate more on this topic?',
      'What are some practical applications of this?',
      'How does this relate to other areas?'
    ];
  }
};
