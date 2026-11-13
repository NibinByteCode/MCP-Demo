import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment.development';

interface Message {
  sender: 'user' | 'assistant';
  text: string;
  query?: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  messages = signal<Message[]>([
    { sender: 'assistant', text: `Hello! I am your ${environment.appName}. Ask me anything!` },
  ]);
  inputMessage = '';
  loading = signal(false);

  constructor(private http: HttpClient) {}

  sendMessage() {
    const text = this.inputMessage.trim();
    if (!text || this.loading()) return;

    this.messages.update((msgs) => [...msgs, { sender: 'user', text }]);
    this.inputMessage = '';
    this.loading.set(true);

    // Use environment variable for API URL
    this.http.post<any>(`${environment.apiUrl}/api/chat`, { message: text }).subscribe({
      next: (res) => {
        this.messages.update((msgs) => [
          ...msgs,
          { sender: 'assistant', text: res.response, query: res.query },
        ]);
        this.loading.set(false);
      },
      error: () => {
        this.messages.update((msgs) => [
          ...msgs,
          { sender: 'assistant', text: 'Error communicating with the backend API.' },
        ]);
        this.loading.set(false);
      },
    });
  }
}
