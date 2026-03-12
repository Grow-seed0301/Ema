import { z } from "zod";

export const userRegistrationSchema = z.object({
  name: z.string().min(2, "名前は2文字以上である必要があります").max(50, "名前は50文字以内である必要があります"),
  email: z.string().email("無効なメールアドレス形式です"),
  password: z.string().min(8, "パスワードは8文字以上である必要があります"),
});
