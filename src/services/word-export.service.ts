import { Injectable } from '@angular/core';
import { TeamData } from './gemini.service';

@Injectable({
  providedIn: 'root'
})
export class WordExportService {

  /**
   * Generates a Word-compatible HTML document and triggers a download.
   * This method is robust for environments where strict Node.js libraries like 'docx' 
   * might face import resolution issues.
   */
  exportToWord(teams: TeamData[]) {
    const header = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' 
            xmlns:w='urn:schemas-microsoft-com:office:word' 
            xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'SimSun', 'Songti SC', serif; font-size: 12pt; line-height: 1.5; }
          h1 { text-align: center; font-size: 18pt; font-weight: bold; margin-bottom: 20px; }
          .team-section { margin-bottom: 30px; }
          .team-title { 
            background-color: yellow; 
            display: inline-block; 
            font-weight: bold; 
            margin-bottom: 10px;
            padding: 2px 5px;
          }
          .section-title { font-weight: bold; margin-top: 10px; margin-bottom: 5px; }
          p { margin: 5px 0; }
          .info-line { text-indent: 0; }
        </style>
      </head>
      <body>
        <h1>风采展示汇总</h1>
    `;

    let bodyContent = '';

    teams.forEach((team, index) => {
      // Fallback for team name if empty
      const teamLabel = team.teamName || `队伍 ${index + 1}`;

      bodyContent += `
        <div class="team-section">
          <div class="team-title">${teamLabel}</div>
          
          <!-- Award Info -->
          <div class="section-title">1、获奖信息</div>
          <p class="info-line">竞赛名称：${team.competitionName}</p>
          <p class="info-line">获奖级别：${team.awardLevel}</p>
          <p class="info-line">所属学院：${team.college}</p>
          <p class="info-line">队伍成员：${team.members}</p>
          <p class="info-line">指导老师：${team.instructors}</p>
          
          <!-- Project Intro -->
          <div class="section-title">2、作品介绍</div>
          <p>${team.projectIntro}</p>
          
          <!-- Reflection -->
          <div class="section-title">3、队伍心得</div>
          <p>${team.reflection}</p>

          <p style="color: red; font-size: 10pt;">[此处请手动插入相关队伍图片/证书]</p>
          <br/>
          <hr/>
        </div>
      `;
    });

    const footer = `</body></html>`;
    const sourceHTML = header + bodyContent + footer;

    const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);
    const fileDownload = document.createElement("a");
    document.body.appendChild(fileDownload);
    fileDownload.href = source;
    fileDownload.download = '推文稿汇总.doc';
    fileDownload.click();
    document.body.removeChild(fileDownload);
  }
}