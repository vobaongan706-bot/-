import { Component, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GeminiService, TeamData } from './services/gemini.service';
import { WordExportService } from './services/word-export.service';

interface ProcessingStatus {
  fileName: string;
  status: 'pending' | 'processing' | 'done' | 'error';
  data?: TeamData;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.component.html',
  styleUrls: [] // Using Tailwind in HTML
})
export class AppComponent {
  private geminiService = inject(GeminiService);
  private wordExportService = inject(WordExportService);

  // State
  processingQueue = signal<ProcessingStatus[]>([]);
  isProcessing = signal<boolean>(false);
  
  // Computed
  hasData = computed(() => this.processingQueue().some(p => p.status === 'done'));
  progress = computed(() => {
    const total = this.processingQueue().length;
    if (total === 0) return 0;
    const completed = this.processingQueue().filter(p => p.status === 'done' || p.status === 'error').length;
    return Math.round((completed / total) * 100);
  });

  async onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const files = Array.from(input.files);
    
    // Add to queue
    const newItems: ProcessingStatus[] = files.map(f => ({
      fileName: f.name,
      status: 'pending'
    }));
    
    this.processingQueue.update(prev => [...prev, ...newItems]);
    this.isProcessing.set(true);

    // Process sequentially to avoid rate limits, or parallel if allowed.
    // For safety with file reading, let's do parallel batches of 2.
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Update status to processing
      this.updateStatus(file.name, 'processing');

      try {
        const base64 = await this.fileToBase64(file);
        // Remove header from base64 string for Gemini
        const base64Data = base64.split(',')[1]; 
        const mimeType = file.type;

        const data = await this.geminiService.extractTeamData(base64Data, mimeType, file.name);
        
        this.updateStatus(file.name, 'done', data);
      } catch (err) {
        console.error(`Error processing ${file.name}`, err);
        this.updateStatus(file.name, 'error');
      }
    }

    this.isProcessing.set(false);
    // Reset input
    input.value = '';
  }

  updateStatus(fileName: string, status: 'pending' | 'processing' | 'done' | 'error', data?: TeamData) {
    this.processingQueue.update(queue => 
      queue.map(item => 
        item.fileName === fileName ? { ...item, status, data } : item
      )
    );
  }

  downloadWordDoc() {
    const completedData = this.processingQueue()
      .filter(p => p.status === 'done' && p.data)
      .map(p => p.data!); // Force unwrap as we filtered
    
    if (completedData.length === 0) return;

    this.wordExportService.exportToWord(completedData);
  }

  removeItem(fileName: string) {
    this.processingQueue.update(prev => prev.filter(p => p.fileName !== fileName));
  }

  // Helper to read file
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  }

  // Helpers for template logic
  getProcessingClass(status: string): string {
    switch (status) {
      case 'processing': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'done': return 'bg-green-50 text-green-700 border-green-200';
      case 'error': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-gray-50 text-gray-500 border-gray-200';
    }
  }
}