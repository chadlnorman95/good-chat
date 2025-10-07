// Mock database implementation for development without PostgreSQL
// This provides the same interface as the real database but stores data in memory

interface MockUser {
  id: string;
  email: string;
  name?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface MockSession {
  id: string;
  userId: string;
  expiresAt: Date;
  createdAt: Date;
}

interface MockMCPConfig {
  id: string;
  name: string;
  config: any;
  createdAt: Date;
  updatedAt: Date;
}

class MockDatabase {
  private users: Map<string, MockUser> = new Map();
  private sessions: Map<string, MockSession> = new Map();
  private mcpConfigs: Map<string, MockMCPConfig> = new Map();

  // User operations
  async createUser(data: Omit<MockUser, 'id' | 'createdAt' | 'updatedAt'>): Promise<MockUser> {
    const user: MockUser = {
      id: Math.random().toString(36).substring(2, 15),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(user.id, user);
    return user;
  }

  async findUserByEmail(email: string): Promise<MockUser | null> {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return null;
  }

  async findUserById(id: string): Promise<MockUser | null> {
    return this.users.get(id) || null;
  }

  // Session operations
  async createSession(data: Omit<MockSession, 'id' | 'createdAt'>): Promise<MockSession> {
    const session: MockSession = {
      id: Math.random().toString(36).substring(2, 15),
      ...data,
      createdAt: new Date(),
    };
    this.sessions.set(session.id, session);
    return session;
  }

  async findSessionById(id: string): Promise<MockSession | null> {
    const session = this.sessions.get(id);
    if (session && session.expiresAt > new Date()) {
      return session;
    }
    if (session) {
      this.sessions.delete(id); // Clean up expired session
    }
    return null;
  }

  async deleteSession(id: string): Promise<void> {
    this.sessions.delete(id);
  }

  // MCP Config operations
  async getMCPConfigs(): Promise<MockMCPConfig[]> {
    return Array.from(this.mcpConfigs.values());
  }

  async createMCPConfig(data: Omit<MockMCPConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<MockMCPConfig> {
    const config: MockMCPConfig = {
      id: Math.random().toString(36).substring(2, 15),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.mcpConfigs.set(config.id, config);
    return config;
  }

  async updateMCPConfig(id: string, data: Partial<Omit<MockMCPConfig, 'id' | 'createdAt'>>): Promise<MockMCPConfig | null> {
    const existing = this.mcpConfigs.get(id);
    if (!existing) return null;

    const updated: MockMCPConfig = {
      ...existing,
      ...data,
      updatedAt: new Date(),
    };
    this.mcpConfigs.set(id, updated);
    return updated;
  }

  async deleteMCPConfig(id: string): Promise<void> {
    this.mcpConfigs.delete(id);
  }

  // Utility methods
  async cleanup(): Promise<void> {
    // Clean up expired sessions
    const now = new Date();
    for (const [id, session] of this.sessions.entries()) {
      if (session.expiresAt <= now) {
        this.sessions.delete(id);
      }
    }
  }

  // Get stats for debugging
  getStats() {
    return {
      users: this.users.size,
      sessions: this.sessions.size,
      mcpConfigs: this.mcpConfigs.size,
    };
  }
}

// Export singleton instance
export const mockDb = new MockDatabase();

// Mock query interface to match Drizzle ORM
export const mockQuery = {
  query: async (sql: string, params?: any[]) => {
    console.log('Mock DB Query:', sql, params);
    return { rows: [] };
  }
};

console.log('📦 Mock Database initialized - No PostgreSQL required!');