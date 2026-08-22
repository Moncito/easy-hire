import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "SEEKER" | "EMPLOYER" | "ADMIN";
    } & DefaultSession["user"];
  }

  interface User {
    role: "SEEKER" | "EMPLOYER" | "ADMIN";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "SEEKER" | "EMPLOYER" | "ADMIN";
    idVerified?: boolean;
    roleRefreshedAt?: number;
  }
}