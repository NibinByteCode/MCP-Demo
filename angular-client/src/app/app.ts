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

    this.messages.update((msgs) => [...msgs, { sender: 'user', text }]);
    this.inputMessage = '';
    this.loading.set(true);

    this.http.post<any>(`${environment.apiUrl}/api/chat`, { message: text }).subscribe({
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
