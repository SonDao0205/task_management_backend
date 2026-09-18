export type ApiResponseData<T> = {
  success: boolean;
  message: string | string[];
  data: T;
  error?: string;
};
