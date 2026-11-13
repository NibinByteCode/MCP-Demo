import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment.development';
import { MarkdownPipe } from './markdown.pipe'; // <-- Import pipe

interface Message {
  sender: 'user' | 'assistant';
  text: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, MarkdownPipe], // <-- Add to imports
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  messages = signal<Message[]>([
    { sender: 'assistant', text: `Hello! I am your ${environment.appName}. Ask me anything!` },
  ]);
  inputMessage = '';
  loading = signal(false);
  private notificationSound = new Audio(
    'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3',
  );

  constructor(private http: HttpClient) {}

  private playSound() {
    this.notificationSound.currentTime = 0;
    this.notificationSound.play().catch((err) => console.log('Audio autoplay blocked', err));
  }

  sendMessage() {
    const text = this.inputMessage.trim();
    if (!text || this.loading()) return;

    // 1. Add current user message to local state first
    this.messages.update((msgs) => [...msgs, { sender: 'user', text }]);
    this.inputMessage = '';
    this.loading.set(true);

    // 2. Prepare the sliding window history (last 2 messages before the current one, if any)
    const currentMessages = this.messages();
    // Get prior messages (excluding the one we just added)
    const priorMessages = currentMessages.slice(0, -1);
    const recentHistory = priorMessages.slice(-2).map((m) => ({
      role: m.sender === 'user' ? 'user' : 'assistant',
      content: m.text,
    }));

    // 3. Send both the current message AND the recent history payload to match backend expectations
    this.http
      .post<any>(`${environment.apiUrl}/api/chat`, {
        message: text,
        messages: recentHistory,
      })
      .subscribe({
        next: (res) => {
          this.messages.update((msgs) => [...msgs, { sender: 'assistant', text: res.response }]);
          this.loading.set(false);
          this.playSound();
        },
        error: () => {
          this.messages.update((msgs) => [
            ...msgs,
            { sender: 'assistant', text: 'Error communicating with the backend API.' },
          ]);
          this.loading.set(false);
          this.playSound();
        },
      });
  }
}
