export type Role = "SEEKER" | "EMPLOYER";

export type CredentialsData = {
  fullName?: string;
  companyName?: string;
  email: string;
  password: string;
};

export type SeekerProfileData = {
  skills: string[];
  availability: string;
  yearsExperience: string;
};

export type EmployerProfileData = {
  industry: string;
  teamSize: string;
};