export interface CommandEntry {
  timestamp: number;
  command: string;
  helmResponse: string;
  statusReport: string;
}

class CommandStore {
  private static instance: CommandStore;
  private commands: CommandEntry[] = [];
  private isClient: boolean;

  private constructor() {
    this.isClient = typeof window !== 'undefined';
    
    // Only try to access localStorage on the client side
    if (this.isClient) {
      const stored = localStorage.getItem('naval_command_history');
      if (stored) {
        this.commands = JSON.parse(stored);
      }
    }
  }

  public static getInstance(): CommandStore {
    if (!CommandStore.instance) {
      CommandStore.instance = new CommandStore();
    }
    return CommandStore.instance;
  }

  addCommand(command: string, helmResponse: string, statusReport: string) {
    const entry: CommandEntry = {
      timestamp: Date.now(),
      command,
      helmResponse,
      statusReport
    };
    this.commands.unshift(entry);
    
    // Only save to localStorage on the client side
    if (this.isClient) {
      this.save();
    }
  }

  getCommands(): CommandEntry[] {
    return this.commands;
  }

  private save() {
    if (this.isClient) {
      localStorage.setItem('naval_command_history', JSON.stringify(this.commands));
    }
  }

  clear() {
    this.commands = [];
    if (this.isClient) {
      localStorage.removeItem('naval_command_history');
    }
  }
}

export const commandStore = CommandStore.getInstance(); 