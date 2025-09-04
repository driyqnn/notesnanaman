interface FeedbackData {
  subjectCategory: string;
  problemSetNumber: number;
  problemNumber: number;
  issueDescription: string;
  correctAnswer?: string;
  solutionImages?: File[];
}

interface DiscordEmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

interface DiscordEmbed {
  title: string;
  fields: DiscordEmbedField[];
  color: number;
  timestamp: string;
}

interface DiscordWebhookPayload {
  embeds: DiscordEmbed[];
}

const DISCORD_WEBHOOK_URL = 'YOUR_DISCORD_WEBHOOK_URL_HERE'; // User needs to replace this

export const sendFeedbackToDiscord = async (feedbackData: FeedbackData): Promise<boolean> => {
  try {
    // Create the embed
    const embed: DiscordEmbed = {
      title: "📚 Problem Set Feedback",
      fields: [
        {
          name: "📖 Subject Category",
          value: feedbackData.subjectCategory,
          inline: true
        },
        {
          name: "📋 Problem Set #",
          value: feedbackData.problemSetNumber.toString(),
          inline: true
        },
        {
          name: "🔢 Problem #",
          value: feedbackData.problemNumber.toString(),
          inline: true
        },
        {
          name: "❌ Issue Description",
          value: feedbackData.issueDescription
        }
      ],
      color: 0x7289DA, // Discord blue
      timestamp: new Date().toISOString()
    };

    // Add correct answer if provided
    if (feedbackData.correctAnswer?.trim()) {
      embed.fields.push({
        name: "✅ Suggested Correction",
        value: feedbackData.correctAnswer
      });
    }

    // Create FormData for multipart upload
    const formData = new FormData();
    
    // Add the payload
    const payload: DiscordWebhookPayload = { embeds: [embed] };
    formData.append('payload_json', JSON.stringify(payload));

    // Add image files if any
    if (feedbackData.solutionImages && feedbackData.solutionImages.length > 0) {
      feedbackData.solutionImages.forEach((file, index) => {
        formData.append(`files[${index}]`, file);
      });
    }

    const response = await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Discord webhook failed: ${response.status} ${response.statusText}`);
    }

    return true;
  } catch (error) {
    console.error('Failed to send feedback to Discord:', error);
    throw error;
  }
};

export type { FeedbackData };