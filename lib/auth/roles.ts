export type Role =
  | "provider"
  | "doctor"
  | "admin"
  | "program_manager"
  | "public";

/** Where each role lands after login. */
export const ROLE_HOME: Record<Role, string> = {
  provider: "/provider",
  doctor: "/doctor",
  admin: "/admin",
  program_manager: "/program",
  public: "/patient",
};

export const ROLE_LABEL: Record<Role, string> = {
  provider: "Provider",
  doctor: "Doctor",
  admin: "Administrator",
  program_manager: "Program Manager",
  public: "Patient",
};

/** Roles that use the desktop sidebar shell (vs. the mobile bottom-nav shell). */
export const DESKTOP_ROLES: Role[] = ["admin", "program_manager"];
