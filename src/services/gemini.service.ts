import { Injectable } from '@angular/core';
import { GoogleGenAI, Type, Schema } from '@google/genai';

export interface TeamData {
  teamName: string; // e.g. "队伍一" or inferred from filename
  competitionName: string;
  awardLevel: string;
  college: string;
  members: string;
  instructors: string;
  projectIntro: string;
  reflection: string;
}

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env['API_KEY'] });
  }

  async extractTeamData(fileBase64: string, mimeType: string, fileName: string): Promise<TeamData> {
    const modelId = 'gemini-2.5-flash';

    const prompt = `
      Analyze the attached document (which may be a PDF page or image). 
      Extract the following information regarding the student competition team.
      
      Fields to extract:
      1. Competition Name (竞赛名称)
      2. Award Level (获奖级别)
      3. College/Department (所属学院)
      4. Team Members (队伍成员) - List them as a comma-separated string.
      5. Instructors (指导老师) - List them as a comma-separated string.
      6. Project Introduction (作品介绍) - Summarize the text found under "作品介绍" or similar sections. Keep it detailed but clean.
      7. Team Reflection (队伍心得) - Summarize the text found under "队伍心得" or similar sections.
      
      If a specific field is not found, return "未提及".
      The 'teamName' should be based on the file content (e.g., "队伍一") or if not found, use the provided filename "${fileName}".
    `;

    const schema: Schema = {
      type: Type.OBJECT,
      properties: {
        teamName: { type: Type.STRING, description: "The team identifier, e.g., '队伍一' or inferred from context." },
        competitionName: { type: Type.STRING },
        awardLevel: { type: Type.STRING },
        college: { type: Type.STRING },
        members: { type: Type.STRING },
        instructors: { type: Type.STRING },
        projectIntro: { type: Type.STRING },
        reflection: { type: Type.STRING },
      },
      required: ["competitionName", "awardLevel", "projectIntro", "reflection"],
    };

    try {
      const response = await this.ai.models.generateContent({
        model: modelId,
        contents: {
          parts: [
            { inlineData: { mimeType: mimeType, data: fileBase64 } },
            { text: prompt }
          ]
        },
        config: {
          responseMimeType: 'application/json',
          responseSchema: schema,
        }
      });

      if (response.text) {
        return JSON.parse(response.text) as TeamData;
      } else {
        throw new Error('No data returned from Gemini');
      }
    } catch (error) {
      console.error('Gemini extraction failed:', error);
      throw error;
    }
  }
}