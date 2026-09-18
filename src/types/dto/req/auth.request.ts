export type RegisterRequest = {
  name: string;
  email: string;
  phone: string;
  password: string;
};

export type LoginRequest = {
  input: string;
  password: string;
};
