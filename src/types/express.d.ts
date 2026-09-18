declare global {
  namespace Express {
    interface Request {
      auth?: {
        user_id: string;
        access_token: string;
      };
    }
  }
}

export {};
