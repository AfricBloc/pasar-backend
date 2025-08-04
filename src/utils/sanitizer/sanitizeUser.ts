export const sanitizer = (user: any) => {
  const { password, ...safeUser } = user;
  return safeUser;
};
