import { GameState, PotentialMove } from '../game-logic/baghchal';
import { WEBSOCKET_URL } from '../config';

export interface MatchmakingResponse {
  status: 'searching' | 'match_found' | 'error';
  match_id?: string;
  opponent?: {
    id: string,
    username: string,
    rating: number
  };
  game_id?: string;
  player_side?: 'Tiger' | 'Goat';
  message?: string;
}

export interface GameMoveData {
  status: 'connected' | 'move_made' | 'move' | 'game_over' | 'error' | 'opponent_disconnected' | 'player_disconnected';
  game_state?: any; // Server format before normalization
  final_state?: any; // Game state when game ends
  winner?: string;
  message?: string;
}

class MatchmakingWebSocket {
  private socket: WebSocket | null = null;
  private onMessageHandler: ((data: MatchmakingResponse) => void) | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  connect(token: string, onMessage: (data: MatchmakingResponse) => void) {
    this.onMessageHandler = onMessage;

    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      console.log('Matchmaking WebSocket already connecting or connected.');
      return;
    }
    
    try {
      const wsUrl = `${WEBSOCKET_URL}/api/v1/matchmaking/ws?token=${encodeURIComponent(token)}`;
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        console.log('Matchmaking WebSocket connected');
        this.reconnectAttempts = 0;
      };

      this.socket.onmessage = (event) => {
        try {
          const data: MatchmakingResponse = JSON.parse(event.data);
          console.log('Matchmaking message received:', data);
          
          this.onMessageHandler?.(data);
        } catch (error) {
          console.error('Error parsing matchmaking message:', error);
        }
      };

      this.socket.onclose = (event) => {
        console.log('Matchmaking WebSocket closed:', event.code, event.reason);
        if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect();
        }
      };

      this.socket.onerror = (error) => {
        console.error('Matchmaking WebSocket error:', error);
      };
    } catch (error) {
      console.error('Failed to create matchmaking WebSocket:', error);
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      if (this.socket && this.onMessageHandler) {
        this.connect(this.socket.url, this.onMessageHandler);
      }
    }, Math.pow(2, this.reconnectAttempts) * 1000); // Exponential backoff
  }

  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    if (this.socket) {
      this.socket.close(1000, 'User disconnected');
      this.socket = null;
    }
    
    this.onMessageHandler = null;
    this.reconnectAttempts = 0;
  }

  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }
}

class GameWebSocket {
  private socket: WebSocket | null = null;
  private messageHandler: ((data: GameMoveData) => void) | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private token: string | null = null;

  connect(gameId: string, token: string, messageHandler: (data: GameMoveData) => void) {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      console.log('Game WebSocket is already connecting or connected.');
      return;
    }
    this.messageHandler = messageHandler;
    this.token = token;
    
    try {
      const wsUrl = `${WEBSOCKET_URL}/api/v1/games/${gameId}/ws?token=${encodeURIComponent(token)}`;
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        console.log(`Game WebSocket connected for game ${gameId}`);
        this.reconnectAttempts = 0;
      };

      this.socket.onmessage = (event) => {
        try {
          const data: GameMoveData = JSON.parse(event.data);
          console.log('Game message received:', data);
          
          this.messageHandler?.(data);
        } catch (error) {
          console.error('Error parsing game message:', error);
        }
      };

      this.socket.onclose = (event) => {
        console.log('Game WebSocket closed:', event.code, event.reason);
        if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.tryReconnect();
        }
      };

      this.socket.onerror = (error) => {
        console.error('Game WebSocket error:', error);
      };
    } catch (error) {
      console.error('Failed to create game WebSocket:', error);
    }
  }

  private tryReconnect() {
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect game socket (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      if (this.socket && this.token && this.messageHandler) {
        const url = this.socket.url;
        const gameId = url.substring(url.lastIndexOf('/ws') - 36, url.lastIndexOf('/ws'));
        this.connect(gameId, this.token, this.messageHandler);
      }
    }, Math.pow(2, this.reconnectAttempts) * 1000); // Exponential backoff
  }

  sendMove(move: any) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({
        type: 'move',
        gameId: this.socket.url,
        move
      }));
    } else {
      console.error('Cannot send move: WebSocket not connected');
    }
  }

  disconnect() {
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    
    if (this.socket) {
      this.socket.close(1000, 'User disconnected');
      this.socket = null;
    }
    
    this.messageHandler = null;
    this.token = null;
    this.reconnectAttempts = 0;
  }

  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  makeMove(move: any) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      console.log('📤 Sending move via WebSocket:', { type: 'move', move });
      this.socket.send(JSON.stringify({ type: 'move', move }));
    } else {
      console.error('WebSocket is not connected.');
    }
  }

  forfeit() {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type: 'forfeit' }));
    } else {
      console.error('WebSocket is not connected.');
    }
  }
}

// Singleton instances
export const matchmakingSocket = new MatchmakingWebSocket();
export const gameSocket = new GameWebSocket(); 